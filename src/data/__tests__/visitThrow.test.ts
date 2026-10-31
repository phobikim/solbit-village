/**
 * @jest-environment node
 */
// [다녀왔슈] 흐름: 쉼 기록(통나무 + "다녀옴") 저장 + 깃발 → 다녀온 곳을 한 트랜잭션으로. 진짜 SQLite(node:sqlite, 메모리 DB).

import { isVisitLog, weekLogs } from '../../domain/fire';
import { tripDays, visitThrow, visitTags, visitText, wishList, type Place } from '../../domain/rest';
import { MIGRATIONS } from '../migrations';
import { savePlaceTx } from '../places';
import { saveRestLogTx, listRestLogsIn } from '../restLogs';

type NodeDb = {
  exec(sql: string): void;
  prepare(sql: string): { all(...args: unknown[]): Record<string, unknown>[]; run(...args: unknown[]): unknown };
};
const nodeSqlite = process.getBuiltinModule?.('node:sqlite') as { DatabaseSync: new (path: string) => NodeDb } | undefined;
const maybe = nodeSqlite ? describe : describe.skip;

function open(): NodeDb {
  const db = new nodeSqlite!.DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const m of MIGRATIONS) db.exec(m);
  return db;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSql = (db: NodeDb): any => ({
  getFirstAsync: async (sql: string, ...p: unknown[]) => db.prepare(sql).all(...p)[0] ?? null,
  getAllAsync: async (sql: string, ...p: unknown[]) => db.prepare(sql).all(...p),
  runAsync: async (sql: string, ...p: unknown[]) => db.prepare(sql).run(...p),
});

const flag: Place = {
  id: 'pl_1', name: '속초', duration: 'half', visited: false, memo: null, note: null, eventId: null, logId: null,
  visitedDate: null, nights: 0, addedDate: '2026-10-01', createdAt: 5,
};

maybe('다녀왔슈: 깃발 → 방문 + 쉼 기록', () => {
  it('쉼 기록과 다녀온 곳이 같이 저장되고, 지도(가고 싶은 곳)에서는 빠지고, 이번 주 장작에 "다녀옴"으로 남는다', async () => {
    const db = open();
    const sql = asSql(db);
    await savePlaceTx(sql, flag);
    const log = { id: 'rl_1', date: '2026-10-27', text: visitText('속초'), tags: visitTags(flag), size: 'log' as const, createdAt: 9 };
    const r = visitThrow(flag, log);
    await saveRestLogTx(sql, r.log);
    await savePlaceTx(sql, r.place);

    const logs = await listRestLogsIn(sql);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: 'rl_1', size: 'log', text: '속초 다녀옴' });
    expect(isVisitLog(logs[0])).toBe(true);
    expect(weekLogs(logs, '2026-10-26').map((l) => l.id)).toEqual(['rl_1']);

    const row = db.prepare('SELECT * FROM place WHERE id = ?').all('pl_1')[0];
    expect(row).toMatchObject({ visited: 1, visited_date: '2026-10-27', nights: 0, log_id: null, created_at: 5 });
    const places = db.prepare('SELECT * FROM place').all();
    expect(places).toHaveLength(1); // 새 장소를 만들지 않는다 (옛 발자국 찍기와 다르다)
    expect(wishList([{ ...flag, visited: true }])).toEqual([]);
    expect([...tripDays([r.place])]).toEqual(['2026-10-27']);
  });

  it('기록 고치기: 같은 id로 다시 저장하면 덮어쓰고 날짜 · 만든 시각은 그대로다', async () => {
    const db = open();
    const sql = asSql(db);
    const log = { id: 'rl_2', date: '2026-10-22', text: '책방', tags: [], size: 'firewood' as const, createdAt: 3 };
    await saveRestLogTx(sql, log);
    await saveRestLogTx(sql, { ...log, text: '책방에서 만화책', size: 'twig', createdAt: 99 });
    const logs = await listRestLogsIn(sql);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ text: '책방에서 만화책', size: 'twig', date: '2026-10-22', createdAt: 3 });
  });
});
