// 쉼 기록 저장소 (장작). 기록 시트의 쉼 칸과 장작 던지기가 같은 테이블을 쓴다 (스키마 v11).

import type { SQLiteDatabase } from 'expo-sqlite';

import type { RestLog, RestSize, RestTag, RestTagKind } from '../domain/fire';
import type { Place } from '../domain/rest';
import { getDb, writeTx } from './db';
import { savePlaceTx } from './places';

type Row = { id: string; date: string; text: string; tags: string; size: RestSize; created_at: number };

const KINDS: readonly RestTagKind[] = ['activity', 'neighbor', 'place', 'etc'];

export function parseTags(json: string): RestTag[] {
  try {
    const v: unknown = JSON.parse(json);
    if (!Array.isArray(v)) return [];
    return v.flatMap((t): RestTag[] => {
      if (!t || typeof t !== 'object') return [];
      const { kind, label, ref } = t as Record<string, unknown>;
      if (typeof label !== 'string' || !KINDS.includes(kind as RestTagKind)) return [];
      return [{ kind: kind as RestTagKind, label, ...(typeof ref === 'string' ? { ref } : {}) }];
    });
  } catch {
    return [];
  }
}

const toLog = (r: Row): RestLog => ({ id: r.id, date: r.date, text: r.text, tags: parseTags(r.tags), size: r.size, createdAt: r.created_at });

export async function listRestLogs(): Promise<RestLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM rest_log ORDER BY date, created_at');
  return rows.map(toLog);
}

/** 기록 시트 쉼 기록의 id (하루 하나, 다시 저장하면 덮어쓴다) */
export const recordLogId = (date: string) => `rec_${date}`;

export async function saveRestLogTx(db: SQLiteDatabase, l: RestLog): Promise<void> {
  await db.runAsync(
    `INSERT INTO rest_log (id, date, text, tags, size, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET date = excluded.date, text = excluded.text, tags = excluded.tags, size = excluded.size`,
    l.id,
    l.date,
    l.text,
    JSON.stringify(l.tags),
    l.size,
    l.createdAt,
  );
}

export async function deleteRestLogTx(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM rest_log WHERE id = ?', id);
}

/** 장작 던지기: 쉼 기록 + (발자국을 찍기로 한) 장소를 한 트랜잭션으로 */
export function throwFirewood(log: RestLog, places: readonly Place[]): Promise<void> {
  return writeTx(async (db) => {
    await saveRestLogTx(db, log);
    for (const p of places) await savePlaceTx(db, p);
  });
}

/** 장작 지우기 (이 장작에서 찍은 발자국은 그대로 둔다 — 다녀온 곳은 보따리의 것) */
export function deleteRestLog(id: string): Promise<void> {
  return writeTx(async (db) => {
    await deleteRestLogTx(db, id);
    await db.runAsync('UPDATE place SET log_id = NULL WHERE log_id = ?', id);
  });
}

/** 이웃 태그가 달린 쉼 기록의 가장 최근 날짜와 횟수 (이웃 탭 통계용) */
export async function restContactStat(neighborId: string): Promise<{ count: number; last: string | null }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number; last: string | null }>(
    'SELECT COUNT(DISTINCT date) AS n, MAX(date) AS last FROM rest_log WHERE tags LIKE ?',
    `%"ref":${JSON.stringify(neighborId)}%`,
  );
  return { count: row?.n ?? 0, last: row?.last ?? null };
}
