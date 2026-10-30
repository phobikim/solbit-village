/**
 * @jest-environment node
 */
// 옷장 테이블(마이그레이션 v12)과 백업 왕복을 진짜 SQLite(node:sqlite, 메모리 DB)에서 돌려 본다.

import { OUTFIT_ITEMS, sanitizeEquipped } from '../../domain/outfit';
import { BACKUP_TABLES, buildBackup, ENSURE_ROWS_SQL, parseBackup, type BackupTable, type Row } from '../backupFormat';
import { MIGRATIONS, SCHEMA_VERSION } from '../migrations';

type Db = {
  exec(sql: string): void;
  prepare(sql: string): { all(...args: unknown[]): Record<string, unknown>[]; run(...args: unknown[]): unknown };
};

const nodeSqlite = process.getBuiltinModule?.('node:sqlite') as { DatabaseSync: new (path: string) => Db } | undefined;
const maybe = nodeSqlite ? describe : describe.skip;

function open(): Db {
  const db = new nodeSqlite!.DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const m of MIGRATIONS) db.exec(m);
  return db;
}

/** backup.ts exportBackupJson / restoreBackup 과 같은 일을 node:sqlite로 */
function exportAll(db: Db): string {
  const tables: Partial<Record<BackupTable, Row[]>> = {};
  for (const [name, cols] of Object.entries(BACKUP_TABLES) as [BackupTable, readonly string[]][]) {
    tables[name] = db.prepare(`SELECT ${cols.join(', ')} FROM ${name}`).all() as Row[];
  }
  return JSON.stringify(buildBackup(SCHEMA_VERSION, tables));
}

function importAll(db: Db, text: string): void {
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

maybe('옷장 테이블 (스키마 v12)', () => {
  it('v12가 최신이다', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(12);
  });

  it('슬롯마다 옷 한 개만 저장된다', () => {
    const db = open();
    db.prepare("INSERT INTO outfit_equipped (slot, item_id) VALUES ('head', 'head-straw')").run();
    expect(() => db.prepare("INSERT INTO outfit_equipped (slot, item_id) VALUES ('head', 'head-beanie')").run()).toThrow();
  });

  it('모르는 슬롯 이름은 저장되지 않는다', () => {
    const db = open();
    expect(() => db.prepare("INSERT INTO outfit_equipped (slot, item_id) VALUES ('tail', 'head-straw')").run()).toThrow();
  });

  it('같은 옷을 두 번 가진 것으로 저장되지 않는다', () => {
    const db = open();
    db.prepare("INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES ('head-straw', '2026-10-29', 'start')").run();
    expect(() => db.prepare("INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES ('head-straw', '2026-10-30', 'shop')").run()).toThrow();
  });
});

maybe('옷장 백업 왕복', () => {
  function dressed(): Db {
    const db = open();
    const ins = db.prepare("INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES (?, '2026-10-29', 'start')");
    for (const it of OUTFIT_ITEMS) ins.run(it.id);
    const eq = db.prepare('INSERT INTO outfit_equipped (slot, item_id) VALUES (?, ?)');
    eq.run('head', 'head-wizard');
    eq.run('body', 'body-hoodie');
    eq.run('back', 'back-cape');
    return db;
  }
  const readEquipped = (db: Db) =>
    sanitizeEquipped(
      Object.fromEntries((db.prepare('SELECT slot, item_id FROM outfit_equipped').all() as { slot: string; item_id: string }[]).map((r) => [r.slot, r.item_id])),
      new Set((db.prepare('SELECT item_id FROM outfit_owned').all() as { item_id: string }[]).map((r) => r.item_id)),
    );

  it('내보내고 → 데이터를 비우고 → 가져오면 입은 옷이 돌아온다', () => {
    const before = dressed();
    const json = exportAll(before);

    const fresh = open(); // 앱 데이터 초기화
    expect(readEquipped(fresh)).toEqual({});
    importAll(fresh, json);

    expect(readEquipped(fresh)).toEqual({ head: 'head-wizard', body: 'body-hoodie', back: 'back-cape' });
    expect(fresh.prepare('SELECT COUNT(*) AS n FROM outfit_owned').all()[0].n).toBe(OUTFIT_ITEMS.length);
  });

  it('가져오면 지금 입은 옷은 백업의 옷으로 바뀐다', () => {
    const json = exportAll(dressed());
    const other = dressed();
    other.exec("DELETE FROM outfit_equipped; INSERT INTO outfit_equipped (slot, item_id) VALUES ('feet', 'feet-boots')");
    importAll(other, json);
    expect(readEquipped(other)).toEqual({ head: 'head-wizard', body: 'body-hoodie', back: 'back-cape' });
  });

  it('모르는 옷 id는 가져올 때 무시한다', () => {
    const json = JSON.parse(exportAll(dressed()));
    json.tables.outfit_owned.push({ item_id: 'head-crown', acquired_at: '2026-10-29', source: 'shop' });
    json.tables.outfit_equipped.push({ slot: 'hand', item_id: 'hand-sword' });
    const db = open();
    importAll(db, JSON.stringify(json));
    expect(db.prepare("SELECT COUNT(*) AS n FROM outfit_owned WHERE item_id = 'head-crown'").all()[0].n).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS n FROM outfit_equipped WHERE slot = 'hand'").all()[0].n).toBe(0);
    expect(readEquipped(db)).toEqual({ head: 'head-wizard', body: 'body-hoodie', back: 'back-cape' });
  });

  it('슬롯과 안 맞는 옷은 가져오지 않는다', () => {
    const json = JSON.parse(exportAll(dressed()));
    json.tables.outfit_equipped = [{ slot: 'feet', item_id: 'head-straw' }];
    const db = open();
    importAll(db, JSON.stringify(json));
    expect(db.prepare('SELECT COUNT(*) AS n FROM outfit_equipped').all()[0].n).toBe(0);
  });

  it('옷장이 없던 예전 백업을 가져와도 문제없다 (옷 테이블은 비어 있게 된다)', () => {
    const json = JSON.parse(exportAll(open()));
    json.schemaVersion = 11;
    delete json.tables.outfit_owned;
    delete json.tables.outfit_equipped;
    const db = dressed();
    importAll(db, JSON.stringify(json));
    expect(db.prepare('SELECT COUNT(*) AS n FROM outfit_owned').all()[0].n).toBe(0);
    expect(readEquipped(db)).toEqual({});
  });
});
