// 하루 기록 저장소. 규칙(수정 가능 여부·정리)은 src/domain/records.ts에서 하고 여기서는 읽고 쓰기만 한다.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayKey } from '../domain/day';
import type { Condition, Contact, ContactMethod, DayRecord, DayType, WorkLevel } from '../domain/types';
import { getDb } from './db';

type RecordRow = {
  date: string;
  condition: number;
  day_type: string;
  work: number | null;
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
    dayType: (row.day_type === 'rest' ? 'rest' : 'work') as DayType,
    work: row.work === null ? null : (row.work as WorkLevel),
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
    `INSERT INTO day_record (date, condition, day_type, work, achievement, memo, leisure, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       condition = excluded.condition,
       day_type = excluded.day_type,
       work = excluded.work,
       achievement = excluded.achievement,
       memo = excluded.memo,
       leisure = excluded.leisure,
       updated_at = excluded.updated_at`,
    r.date,
    r.condition,
    r.dayType,
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

/** 쉼(여가)을 적었거나 쉬는 날로 적은 가장 최근 날 (upTo 포함). 쉼터 '마지막 쉼' — 불러온 달 밖의 기록까지 본다. */
export async function lastLeisureDay(upTo: DayKey): Promise<DayKey | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ date: string | null }>(
    "SELECT MAX(date) AS date FROM day_record WHERE (leisure <> '[]' OR day_type = 'rest') AND date <= ?",
    upTo,
  );
  return row?.date ?? null;
}
