/**
 * @jest-environment node
 */
// 마을 배경(스키마 v14): 시작 보유 · 구매 트랜잭션(성공 · 롤백) · 적용 상태 저장 · 백업 왕복을 진짜 SQLite(node:sqlite, 메모리 DB)에서 돌려 본다.

import { BG_PRICE_PAID } from '../../domain/villageBg';
import { BACKUP_TABLES, buildBackup, ENSURE_ROWS_SQL, parseBackup, type BackupTable, type Row } from '../backupFormat';
import { MIGRATIONS, SCHEMA_VERSION } from '../migrations';
import { PurchaseError, purchaseVillageBgIn, readWallet, writeWalletIn, type Sql } from '../walletTx';

type NodeDb = {
  exec(sql: string): void;
  prepare(sql: string): { all(...args: unknown[]): Record<string, unknown>[]; run(...args: unknown[]): unknown };
};

const nodeSqlite = process.getBuiltinModule?.('node:sqlite') as { DatabaseSync: new (path: string) => NodeDb } | undefined;
const maybe = nodeSqlite ? describe : describe.skip;

function open(upTo = MIGRATIONS.length): NodeDb {
  const db = new nodeSqlite!.DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (let v = 0; v < upTo; v++) db.exec(MIGRATIONS[v]);
  return db;
}

/** expo-sqlite의 비동기 API 모양으로 감싼다. failOn이 들어 있는 쓰기는 일부러 실패시킨다 */
function asSql(db: NodeDb, failOn?: string): Sql {
  const adapter = {
    getFirstAsync: async (sql: string, ...p: unknown[]) => db.prepare(sql).all(...p)[0] ?? null,
    getAllAsync: async (sql: string, ...p: unknown[]) => db.prepare(sql).all(...p),
    runAsync: async (sql: string, ...p: unknown[]) => {
      if (failOn && sql.includes(failOn)) throw new Error('boom');
      return db.prepare(sql).run(...p);
    },
  };
  return adapter as unknown as Sql;
}

/** writeTx와 같은 일: 트랜잭션 안에서 실행하고, 예외가 나면 전부 되돌린다 */
async function inTx<T>(db: NodeDb, task: () => Promise<T>): Promise<T> {
  db.exec('BEGIN');
  try {
    const out = await task();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

const ids = (db: NodeDb) => db.prepare('SELECT id FROM village_bg_owned ORDER BY id').all().map((r) => r.id);
const equippedSetting = (db: NodeDb) => db.prepare("SELECT value FROM settings WHERE key = 'village_bg_equipped'").all()[0]?.value;

maybe('스키마 v14 마을 배경', () => {
  it('v14가 최신이고 시작 보유는 기본 하나뿐이다 (기본 배경은 무료 · 시작 보유)', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(14);
    expect(ids(open())).toEqual(['base']);
  });

  it('v13에서 올려도 기존 지갑 · 옷 값을 지우지 않는다', () => {
    const db = open(13);
    db.prepare('UPDATE wallet SET coin = 777').run();
    db.prepare("INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES ('head-straw', '2026-10-29', 'shop')").run();
    db.exec(MIGRATIONS[13]);
    expect(db.prepare('SELECT coin FROM wallet').all()[0].coin).toBe(777);
    expect(db.prepare('SELECT item_id FROM outfit_owned').all()).toHaveLength(1);
    expect(ids(db)).toEqual(['base']);
  });

  it('구매 성공: 코인 차감 + 보유 추가 + 바로 적용이 한 번에', async () => {
    const db = open();
    const sql = asSql(db);
    await inTx(db, () => writeWalletIn(sql, { coin: 2000, heung: 5 }));
    const r = await inTx(db, () => purchaseVillageBgIn(sql, 'spring', '2026-10-30'));
    expect(r.wallet).toEqual({ coin: 2000 - BG_PRICE_PAID, heung: 5 });
    expect(r.equipped).toBe('spring');
    expect(r.owned.has('spring')).toBe(true);
    expect(await readWallet(sql)).toEqual({ coin: 500, heung: 5 });
    expect(ids(db)).toEqual(['base', 'spring']);
    expect(equippedSetting(db)).toBe('spring');
  });

  it('코인이 모자라면 PurchaseError, 아무것도 바뀌지 않는다', async () => {
    const db = open();
    const sql = asSql(db);
    await inTx(db, () => writeWalletIn(sql, { coin: 1499, heung: 0 }));
    await expect(inTx(db, () => purchaseVillageBgIn(sql, 'spring', '2026-10-30'))).rejects.toBeInstanceOf(PurchaseError);
    expect(await readWallet(sql)).toEqual({ coin: 1499, heung: 0 });
    expect(ids(db)).toEqual(['base']);
    expect(equippedSetting(db)).toBeUndefined();
  });

  it('이미 가진 배경 · 기본 · 모르는 배경은 살 수 없다', async () => {
    const db = open();
    const sql = asSql(db);
    await inTx(db, () => writeWalletIn(sql, { coin: 9000, heung: 0 }));
    for (const id of ['base', 'volcano']) await expect(inTx(db, () => purchaseVillageBgIn(sql, id, '2026-10-30'))).rejects.toBeInstanceOf(PurchaseError);
    await inTx(db, () => purchaseVillageBgIn(sql, 'night', '2026-10-30'));
    await expect(inTx(db, () => purchaseVillageBgIn(sql, 'night', '2026-10-30'))).rejects.toMatchObject({ reason: 'owned' });
    expect((await readWallet(sql)).coin).toBe(9000 - BG_PRICE_PAID);
  });

  it('중간(보유 추가 · 적용 저장)에서 실패하면 코인까지 전부 롤백된다', async () => {
    for (const failOn of ['INSERT INTO village_bg_owned', 'INSERT INTO settings']) {
      const db = open();
      await inTx(db, () => writeWalletIn(asSql(db), { coin: 3000, heung: 0 }));
      await expect(inTx(db, () => purchaseVillageBgIn(asSql(db, failOn), 'autumn', '2026-10-30'))).rejects.toThrow('boom');
      expect(await readWallet(asSql(db))).toEqual({ coin: 3000, heung: 0 });
      expect(ids(db)).toEqual(['base']);
      expect(equippedSetting(db)).toBeUndefined();
    }
  });

  it('백업 왕복: 가진 배경과 적용 상태가 그대로 돌아오고, 모르는 id는 가져오지 않는다', () => {
    expect(BACKUP_TABLES.village_bg_owned).toEqual(['id', 'acquired_at', 'source']);
    const db = open();
    db.prepare("INSERT INTO village_bg_owned (id, acquired_at, source) VALUES ('winter', '2026-10-30', 'shop')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('village_bg_equipped', 'winter')").run();
    const tables: Partial<Record<BackupTable, Row[]>> = {};
    for (const [name, cols] of Object.entries(BACKUP_TABLES) as [BackupTable, readonly string[]][]) {
      tables[name] = db.prepare(`SELECT ${cols.join(', ')} FROM ${name}`).all() as Row[];
    }
    const json = JSON.stringify(buildBackup(SCHEMA_VERSION, tables));
    const back = parseBackup(json, SCHEMA_VERSION);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.backup.tables.village_bg_owned?.map((r) => r.id).sort()).toEqual(['base', 'winter']);
    expect(back.backup.tables.settings?.find((r) => r.key === 'village_bg_equipped')?.value).toBe('winter');

    const withJunk = JSON.parse(json);
    withJunk.tables.village_bg_owned.push({ id: 'volcano', acquired_at: null, source: 'shop' });
    const again = parseBackup(JSON.stringify(withJunk), SCHEMA_VERSION);
    expect(again.ok && again.backup.tables.village_bg_owned?.map((r) => r.id).sort()).toEqual(['base', 'winter']);
  });

  it('배경이 없던 예전 백업을 가져와도 기본이 시작 보유로 채워진다', () => {
    const db = open();
    db.exec('DELETE FROM village_bg_owned');
    for (const sql of ENSURE_ROWS_SQL) db.exec(sql);
    expect(ids(db)).toEqual(['base']);
  });
});
