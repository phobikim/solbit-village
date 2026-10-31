/**
 * @jest-environment node
 */
// 스키마 마이그레이션을 진짜 SQLite(node:sqlite, 메모리 DB)에서 돌려 본다.
// expo-sqlite는 jest에서 못 쓰므로 같은 SQL을 Node 내장 SQLite로 실행한다.

import { MIGRATIONS, SCHEMA_VERSION } from '../migrations';

type Db = {
  exec(sql: string): void;
  prepare(sql: string): { all(...args: unknown[]): Record<string, unknown>[]; run(...args: unknown[]): unknown };
};

// jest의 모듈 해석을 거치지 않고 Node 내장 모듈을 직접 가져온다 (node:sqlite는 접두사 전용)
const nodeSqlite = process.getBuiltinModule?.('node:sqlite') as { DatabaseSync: new (path: string) => Db } | undefined;
const maybe = nodeSqlite ? describe : describe.skip;

function open(upTo: number): Db {
  const db = new nodeSqlite!.DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (let v = 0; v < upTo; v++) db.exec(MIGRATIONS[v]);
  return db;
}

maybe('마이그레이션 v11: 기존 여가/쉼 기록 → 쉼 기록(장작)', () => {
  it('v11이 최신이다', () => {
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(11);
  });

  it('여가 칩이 있는 날마다 쉼 기록 하나, 크기는 장작, 칩은 활동 태그', () => {
    const db = open(10);
    const ins = db.prepare(
      "INSERT INTO day_record (date, condition, day_type, work, leisure, created_at, updated_at) VALUES (?, 2, ?, ?, ?, ?, ?)",
    );
    ins.run('2026-10-20', 'work', 2, '["산책","영화"]', 100, 100);
    ins.run('2026-10-21', 'work', 1, '[]', 200, 200); // 쉼 없음
    ins.run('2026-10-24', 'rest', null, '[]', 300, 300); // 쉬는 날이지만 쉼 칸은 비움
    ins.run('2026-10-25', 'rest', null, '["휴식"]', 400, 400);
    db.exec(MIGRATIONS[10]);

    const rows = db.prepare('SELECT * FROM rest_log ORDER BY date').all();
    expect(rows.map((r) => r.id)).toEqual(['rec_2026-10-20', 'rec_2026-10-25']);
    expect(rows.every((r) => r.size === 'firewood')).toBe(true);
    expect(rows.every((r) => r.text === '')).toBe(true);
    expect(rows[0]).toMatchObject({ date: '2026-10-20', created_at: 100 });
    expect(JSON.parse(String(rows[0].tags))).toEqual([
      { kind: 'activity', label: '산책' },
      { kind: 'activity', label: '영화' },
    ]);
    expect(JSON.parse(String(rows[1].tags))).toEqual([{ kind: 'activity', label: '휴식' }]);
  });

  it('기록(day_record) 자체는 그대로 둔다 — 작물 · 기록 카드는 계속 leisure를 쓴다', () => {
    const db = open(10);
    db.prepare("INSERT INTO day_record (date, condition, day_type, work, leisure, created_at, updated_at) VALUES ('2026-10-20', 3, 'work', 2, '[\"산책\"]', 1, 1)").run();
    db.exec(MIGRATIONS[10]);
    expect(db.prepare('SELECT leisure, condition FROM day_record').all()).toEqual([{ leisure: '["산책"]', condition: 3 }]);
  });

  it('기존 보따리는 그대로이고 log_id만 비어서 생긴다', () => {
    const db = open(10);
    db.prepare(
      "INSERT INTO place (id, name, duration, visited, visited_date, nights, added_date, created_at) VALUES ('p1', '제주', 'weekend', 1, '2025-10-19', 3, '2025-09-01', 5)",
    ).run();
    db.exec(MIGRATIONS[10]);
    expect(db.prepare('SELECT id, name, visited, nights, log_id FROM place').all()).toEqual([
      { id: 'p1', name: '제주', visited: 1, nights: 3, log_id: null },
    ]);
  });

  it('깨진 leisure 값이 있어도 마이그레이션은 끝난다', () => {
    const db = open(10);
    db.prepare("INSERT INTO day_record (date, condition, day_type, work, leisure, created_at, updated_at) VALUES ('2026-10-20', 2, 'work', 1, 'not-json', 1, 1)").run();
    expect(() => db.exec(MIGRATIONS[10])).not.toThrow();
    expect(db.prepare('SELECT COUNT(*) AS n FROM rest_log').all()[0].n).toBe(0);
  });

  it('쉼 기록은 크기를 세 가지로만 받는다', () => {
    const db = open(11);
    const ins = db.prepare("INSERT INTO rest_log (id, date, text, tags, size, created_at) VALUES (?, '2026-10-20', '', '[]', ?, 1)");
    expect(() => ins.run('a', 'twig')).not.toThrow();
    expect(() => ins.run('b', 'huge')).toThrow();
  });

  it('처음부터 끝까지 빈 DB에서도 돈다', () => {
    const db = open(SCHEMA_VERSION);
    expect(db.prepare('SELECT COUNT(*) AS n FROM rest_log').all()[0].n).toBe(0);
  });
});

maybe('마이그레이션 v15: 행사 종료일 (여러 날 일정)', () => {
  it('이미 있는 행사는 종료일 NULL(하루 일정)로 그대로 남는다', () => {
    const db = open(14);
    db.prepare("INSERT INTO event (id, name, date, type, repeat_yearly, created_at) VALUES ('e1', '엄마 생신', '2026-11-04', 'birth', 1, 1)").run();
    db.exec(MIGRATIONS[14]);
    const row = db.prepare("SELECT * FROM event WHERE id = 'e1'").all()[0];
    expect(row).toMatchObject({ name: '엄마 생신', date: '2026-11-04', end_date: null, type: 'birth', repeat_yearly: 1 });
  });
  it('종료일을 넣어 저장할 수 있다', () => {
    const db = open(SCHEMA_VERSION);
    db.prepare("INSERT INTO event (id, name, date, end_date, type, repeat_yearly, created_at) VALUES ('e2', '제주 여행', '2026-10-27', '2026-10-29', 'travel', 0, 2)").run();
    expect(db.prepare("SELECT end_date FROM event WHERE id = 'e2'").all()[0].end_date).toBe('2026-10-29');
  });
});
