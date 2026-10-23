// 보따리 저장소 (쉼터: 가고 싶은 곳 · 다녀온 곳)

import type { SQLiteDatabase } from 'expo-sqlite';

import type { Place, PlaceDuration } from '../domain/rest';
import { getDb, writeTx } from './db';

type Row = {
  id: string;
  name: string;
  duration: PlaceDuration;
  visited: number;
  memo: string | null;
  note: string | null;
  event_id: string | null;
  log_id: string | null;
  visited_date: string | null;
  nights: number;
  added_date: string;
  created_at: number;
};

const toPlace = (r: Row): Place => ({
  id: r.id,
  name: r.name,
  duration: r.duration,
  visited: r.visited === 1,
  memo: r.memo,
  note: r.note,
  eventId: r.event_id,
  logId: r.log_id,
  visitedDate: r.visited_date,
  nights: r.nights,
  addedDate: r.added_date,
  createdAt: r.created_at,
});

export async function listPlaces(): Promise<Place[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM place ORDER BY created_at');
  return rows.map(toPlace);
}

export async function savePlaceTx(db: SQLiteDatabase, p: Place): Promise<void> {
  await db.runAsync(
    `INSERT INTO place (id, name, duration, visited, memo, note, event_id, log_id, visited_date, nights, added_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, duration = excluded.duration, visited = excluded.visited, memo = excluded.memo, note = excluded.note,
       event_id = excluded.event_id, log_id = excluded.log_id, visited_date = excluded.visited_date, nights = excluded.nights`,
    p.id,
    p.name,
    p.duration,
    p.visited ? 1 : 0,
    p.memo,
    p.note,
    p.eventId,
    p.logId,
    p.visitedDate,
    p.nights,
    p.addedDate,
    p.createdAt,
  );
}

export function savePlace(p: Place): Promise<void> {
  return writeTx((db) => savePlaceTx(db, p));
}

/** 여러 곳을 한 번에 (깃발 → 발자국 정산) */
export function savePlaces(list: readonly Place[]): Promise<void> {
  return writeTx(async (db) => {
    for (const p of list) await savePlaceTx(db, p);
  });
}

export function deletePlace(id: string): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync('DELETE FROM place WHERE id = ?', id);
  });
}

/** '날짜 잡기': 여행 행사와 잇는다 */
export function linkPlaceEvent(placeId: string, eventId: string): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync('UPDATE place SET event_id = ? WHERE id = ?', eventId, placeId);
  });
}
