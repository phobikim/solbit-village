// 행사 저장소 (이장네 장부)

import type { DayKey } from '../domain/day';
import type { EventType, VillageEvent } from '../domain/events';
import { getDb, writeTx } from './db';

type Row = { id: string; name: string; date: string; type: EventType; repeat_yearly: number; created_at: number };

const toEvent = (r: Row): VillageEvent => ({
  id: r.id,
  name: r.name,
  date: r.date,
  type: r.type,
  repeatYearly: r.repeat_yearly === 1,
  createdAt: r.created_at,
});

export async function listEvents(): Promise<VillageEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM event ORDER BY date, created_at');
  return rows.map(toEvent);
}

export function saveEvent(e: VillageEvent): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync(
      `INSERT INTO event (id, name, date, type, repeat_yearly, created_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, date = excluded.date, type = excluded.type, repeat_yearly = excluded.repeat_yearly`,
      e.id,
      e.name,
      e.date,
      e.type,
      e.repeatYearly ? 1 : 0,
      e.createdAt,
    );
  });
}

export function deleteEvent(id: string): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync('DELETE FROM event WHERE id = ?', id);
  });
}

/** 성취가 적힌 기록 (지나간 일) */
export async function listAchievements(): Promise<{ date: DayKey; text: string }[]> {
  const db = await getDb();
  return db.getAllAsync<{ date: string; text: string }>(
    'SELECT date, achievement AS text FROM day_record WHERE achievement IS NOT NULL ORDER BY date DESC',
  );
}

export function newId(prefix: string, now = Date.now()): string {
  return `${prefix}_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
