/**
 * @jest-environment node
 */
// 재화(스키마 v13): 지갑 쓰기 · 옷 구매 트랜잭션(성공 · 롤백) · 백업 왕복을 진짜 SQLite(node:sqlite, 메모리 DB)에서 돌려 본다.

import { STARTS_OWNED } from '../../domain/outfit';
import { FOR_SALE, priceOf } from '../../domain/shop';
import { BACKUP_TABLES, buildBackup, ENSURE_ROWS_SQL, parseBackup, type BackupTable, type Row } from '../backupFormat';
import { MIGRATIONS, SCHEMA_VERSION } from '../migrations';
import { addToWalletIn, PurchaseError, purchaseOutfitIn, readWallet, WalletError, writeWalletIn, type Sql } from '../walletTx';

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

const count = (db: NodeDb, table: string) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).all()[0].n as number;

function seedStart(db: NodeDb) {
  const ins = db.prepare("INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES (?, '2026-10-30', 'start')");
  for (const id of STARTS_OWNED) ins.run(id);
}

maybe('스키마 v13', () => {
  it('v13이 최신이고 wallet 한 줄이 0 · 0으로 들어 있다', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(13);
    const db = open();
    expect(db.prepare('SELECT id, coin, heung FROM wallet').all()).toEqual([{ id: 1, coin: 0, heung: 0 }]);
  });

  it('DB도 음수를 막는다 (CHECK)', () => {
    const db = open();
    expect(() => db.prepare('UPDATE wallet SET coin = -1').run()).toThrow();
    expect(() => db.prepare('UPDATE wallet SET heung = -1').run()).toThrow();
  });

  it('줄은 하나뿐이다', () => {
    const db = open();
    expect(() => db.prepare('INSERT INTO wallet (id, coin, heung) VALUES (2, 0, 0)').run()).toThrow();
  });

  it('v12에서 올려도 이미 가진 옷을 지우지 않는다 (보유는 줄지 않는다)', () => {
    const db = open(12);
    const ins = db.prepare("INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES (?, '2026-10-29', 'start')");
    for (const id of ['head-wizard', 'back-wings', 'body-sweater']) ins.run(id);
    db.exec(MIGRATIONS[12]);
    expect(count(db, 'outfit_owned')).toBe(3);
    expect(count(db, 'wallet')).toBe(1);
  });
});

maybe('지갑 쓰기', () => {
  it('더하고 읽는다', async () => {
    const db = open();
    const sql = asSql(db);
    await inTx(db, () => addToWalletIn(sql, { coin: 100, heung: 10 }));
    expect(await readWallet(sql)).toEqual({ coin: 100, heung: 10 });
  });

  it('잔액이 모자라면 거부하고 아무것도 바뀌지 않는다', async () => {
    const db = open();
    const sql = asSql(db);
    await inTx(db, () => addToWalletIn(sql, { coin: 100 }));
    await expect(inTx(db, () => addToWalletIn(sql, { coin: -101 }))).rejects.toBeInstanceOf(WalletError);
    expect(await readWallet(sql)).toEqual({ coin: 100, heung: 0 });
  });

  it('통째로 쓰기도 음수면 거부한다', async () => {
    const db = open();
    const sql = asSql(db);
    await expect(inTx(db, () => writeWalletIn(sql, { coin: -5, heung: 0 }))).rejects.toBeInstanceOf(WalletError);
    expect(await readWallet(sql)).toEqual({ coin: 0, heung: 0 });
    await inTx(db, () => writeWalletIn(sql, { coin: 7, heung: 2 }));
    expect(await readWallet(sql)).toEqual({ coin: 7, heung: 2 });
  });
});

maybe('옷 구매 트랜잭션', () => {
  it('성공: 코인 차감 + 보유 추가 + 그 슬롯에 바로 착용', async () => {
    const db = open();
    seedStart(db);
    db.exec("INSERT INTO outfit_equipped (slot, item_id) VALUES ('body', 'body-hoodie'), ('head', 'head-beanie')");
    const sql = asSql(db);
    await inTx(db, () => addToWalletIn(sql, { coin: 680 }));

    const r = await inTx(db, () => purchaseOutfitIn(sql, 'body-sweater', '2026-10-30'));

    expect(r.wallet.coin).toBe(380);
    expect((await readWallet(sql)).coin).toBe(380);
    expect(db.prepare("SELECT item_id, source FROM outfit_owned WHERE item_id = 'body-sweater'").all()).toEqual([
      { item_id: 'body-sweater', source: 'shop' },
    ]);
    expect(count(db, 'outfit_owned')).toBe(7);
    expect(db.prepare("SELECT item_id FROM outfit_equipped WHERE slot = 'body'").all()).toEqual([{ item_id: 'body-sweater' }]);
    expect(db.prepare("SELECT item_id FROM outfit_equipped WHERE slot = 'head'").all()).toEqual([{ item_id: 'head-beanie' }]);
    expect(r.equipped.body).toBe('body-sweater');
  });

  it('중간에 실패하면 전부 되돌린다 (코인 · 보유 · 착용)', async () => {
    const db = open();
    seedStart(db);
    db.exec("INSERT INTO outfit_equipped (slot, item_id) VALUES ('body', 'body-hoodie')");
    await inTx(db, () => addToWalletIn(asSql(db), { coin: 680 }));

    // 착용 저장 단계에서 터지게 한다 — 앞 단계(코인 차감 · 보유 추가)는 이미 쓰여 있다
    await expect(inTx(db, () => purchaseOutfitIn(asSql(db, 'INTO outfit_equipped'), 'body-sweater', '2026-10-30'))).rejects.toThrow('boom');

    const sql = asSql(db);
    expect((await readWallet(sql)).coin).toBe(680);
    expect(count(db, 'outfit_owned')).toBe(6);
    expect(db.prepare("SELECT item_id FROM outfit_equipped WHERE slot = 'body'").all()).toEqual([{ item_id: 'body-hoodie' }]);
  });

  it('보유 추가 단계에서 실패해도 코인은 그대로다', async () => {
    const db = open();
    seedStart(db);
    await inTx(db, () => addToWalletIn(asSql(db), { coin: 680 }));
    await expect(inTx(db, () => purchaseOutfitIn(asSql(db, 'INTO outfit_owned'), 'head-straw', '2026-10-30'))).rejects.toThrow('boom');
    expect((await readWallet(asSql(db))).coin).toBe(680);
    expect(count(db, 'outfit_owned')).toBe(6);
  });

  it('코인이 모자라면 PurchaseError(short), 아무것도 바뀌지 않는다', async () => {
    const db = open();
    seedStart(db);
    const sql = asSql(db);
    await inTx(db, () => addToWalletIn(sql, { coin: 380 }));
    const err = await inTx(db, () => purchaseOutfitIn(sql, 'back-wings', '2026-10-30')).catch((e) => e);
    expect(err).toBeInstanceOf(PurchaseError);
    expect(err).toMatchObject({ reason: 'short', lack: 420 });
    expect((await readWallet(sql)).coin).toBe(380);
    expect(count(db, 'outfit_owned')).toBe(6);
    expect(count(db, 'outfit_equipped')).toBe(0);
  });

  it('이미 가진 옷은 다시 사지 못한다', async () => {
    const db = open();
    seedStart(db);
    const sql = asSql(db);
    await inTx(db, () => addToWalletIn(sql, { coin: 1000 }));
    await expect(inTx(db, () => purchaseOutfitIn(sql, 'head-beanie', '2026-10-30'))).rejects.toMatchObject({ reason: 'owned' });
    expect((await readWallet(sql)).coin).toBe(1000);
  });

  it('판매 19벌을 모두 사면 합계 6,100 코인이 나가고 25벌이 된다', async () => {
    const db = open();
    seedStart(db);
    const sql = asSql(db);
    await inTx(db, () => addToWalletIn(sql, { coin: 6100 }));
    for (const id of FOR_SALE) await inTx(db, () => purchaseOutfitIn(sql, id, '2026-10-30'));
    expect((await readWallet(sql)).coin).toBe(0);
    expect(count(db, 'outfit_owned')).toBe(25);
    // 마지막으로 산 옷이 각 슬롯에 입혀져 있다 (슬롯마다 한 벌)
    expect(count(db, 'outfit_equipped')).toBe(6);
    expect(priceOf('back-wings')).toBe(800);
  });
});

// ── 백업 왕복 ────────────────────────────────────────────────────────

function exportAll(db: NodeDb): string {
  const tables: Partial<Record<BackupTable, Row[]>> = {};
  for (const [name, cols] of Object.entries(BACKUP_TABLES) as [BackupTable, readonly string[]][]) {
    tables[name] = db.prepare(`SELECT ${cols.join(', ')} FROM ${name}`).all() as Row[];
  }
  return JSON.stringify(buildBackup(SCHEMA_VERSION, tables));
}

/** backup.ts restoreBackup 과 같은 일을 node:sqlite로 */
function importAll(db: NodeDb, text: string): void {
  const parsed = parseBackup(text, SCHEMA_VERSION);
  if (!parsed.ok) throw new Error(parsed.reason);
  const names = Object.keys(BACKUP_TABLES) as BackupTable[];
  for (const name of [...names].reverse()) db.exec(`DELETE FROM ${name}`);
  for (const name of names) {
    for (const row of parsed.backup.tables[name] ?? []) {
      const cols = Object.keys(row);
      if (!cols.length) continue;
      db.prepare(`INSERT OR REPLACE INTO ${name} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...cols.map((c) => row[c]));
    }
  }
  for (const sql of ENSURE_ROWS_SQL) db.exec(sql);
}

maybe('재화 백업 왕복 (스키마 v13)', () => {
  it('내보내고 → 비우고 → 가져오면 코인 · 흥이 돌아온다', () => {
    const before = open();
    before.exec('UPDATE wallet SET coin = 680, heung = 42');
    const json = exportAll(before);
    expect(JSON.parse(json).schemaVersion).toBe(SCHEMA_VERSION);
    expect(JSON.parse(json).tables.wallet).toEqual([{ id: 1, coin: 680, heung: 42 }]);

    const fresh = open();
    importAll(fresh, json);
    expect(fresh.prepare('SELECT coin, heung FROM wallet').all()).toEqual([{ coin: 680, heung: 42 }]);
  });

  it('구버전(v12) 백업에는 지갑이 없다 → 가져오면 0 · 0으로 채운다', () => {
    const json = JSON.parse(exportAll(open()));
    json.schemaVersion = 12;
    delete json.tables.wallet;
    const db = open();
    db.exec('UPDATE wallet SET coin = 999, heung = 99');
    importAll(db, JSON.stringify(json));
    expect(db.prepare('SELECT id, coin, heung FROM wallet').all()).toEqual([{ id: 1, coin: 0, heung: 0 }]);
  });

  it('모르는 필드 · 모르는 테이블은 무시하고, 음수 · 이상한 값은 0으로 고친다', () => {
    const json = JSON.parse(exportAll(open()));
    json.tables.wallet = [{ id: 1, coin: -50, heung: 7, gems: 3 }];
    json.tables.cloud = [{ x: 1 }];
    const db = open();
    importAll(db, JSON.stringify(json));
    expect(db.prepare('SELECT id, coin, heung FROM wallet').all()).toEqual([{ id: 1, coin: 0, heung: 7 }]);
  });

  it('지금 앱보다 새 버전 백업은 받지 않는다', () => {
    const json = JSON.parse(exportAll(open()));
    json.schemaVersion = SCHEMA_VERSION + 1;
    expect(parseBackup(JSON.stringify(json), SCHEMA_VERSION)).toEqual({ ok: false, reason: 'tooNew' });
  });
});
