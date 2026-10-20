// 하루 기록 저장소. 규칙(수정 가능 여부·정리)은 src/domain/records.ts에서 하고 여기서는 읽고 쓰기만 한다.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayKey } from '../domain/day';
import type { Condition, Contact, ContactMethod, DayRecord, WorkLevel } from '../domain/types';
import { getDb } from './db';

type RecordRow = {
  date: string;
  condition: number;
  work: number;
  achievement: string | null;
  memo: string | null;
  leisure: string;
  created_at: number;
  updated_at: number;
};

type ContactRow = { date: string; neighbor_id: string; method: string };

function parseLeisure(json: string): string[] {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function toRecord(row: RecordRow, contacts: Contact[]): DayRecord {
  return {
    date: row.date,
    condition: row.condition as Condition,
    work: row.work as WorkLevel,
    achievement: row.achievement,
    memo: row.memo,
    leisure: parseLeisure(row.leisure),
    contacts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** from ~ to (둘 다 포함) 기록. 날짜 오름차순. */
export async function listDayRecords(from: DayKey, to: DayKey): Promise<DayRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RecordRow>(
    'SELECT * FROM day_record WHERE date BETWEEN ? AND ? ORDER BY date',
    from,
    to,
  );
  const contacts = await db.getAllAsync<ContactRow>(
    'SELECT date, neighbor_id, method FROM contact WHERE date BETWEEN ? AND ? ORDER BY id',
    from,
    to,
  );
  const byDate = new Map<string, Contact[]>();
  for (const c of contacts) {
    const list = byDate.get(c.date) ?? [];
    list.push({ neighborId: c.neighbor_id, method: c.method as ContactMethod });
    byDate.set(c.date, list);
  }
  return rows.map((r) => toRecord(r, byDate.get(r.date) ?? []));
}

export async function getDayRecord(date: DayKey): Promise<DayRecord | null> {
  const [r] = await listDayRecords(date, date);
  return r ?? null;
}

/** 기록 저장 (같은 날이면 내용만 갱신). 연락 목록은 통째로 바꾼다. 트랜잭션 안에서 부른다. */
export async function saveDayRecordTx(db: SQLiteDatabase, r: DayRecord): Promise<void> {
  await db.runAsync(
    `INSERT INTO day_record (date, condition, work, achievement, memo, leisure, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       condition = excluded.condition,
       work = excluded.work,
       achievement = excluded.achievement,
       memo = excluded.memo,
       leisure = excluded.leisure,
       updated_at = excluded.updated_at`,
    r.date,
    r.condition,
    r.work,
    r.achievement,
    r.memo,
    JSON.stringify(r.leisure),
    r.createdAt,
    r.updatedAt,
  );
  await db.runAsync('DELETE FROM contact WHERE date = ?', r.date);
  for (const c of r.contacts) {
    await db.runAsync('INSERT INTO contact (date, neighbor_id, method) VALUES (?, ?, ?)', r.date, c.neighborId, c.method);
  }
}
