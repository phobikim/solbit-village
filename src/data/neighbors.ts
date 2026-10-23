// 이웃 저장소. 등록 화면(9f)은 단계 5.

import type { Relation } from '../copy/labels.ko';
import type { NeighborContactStat } from '../domain/neighbors';
import { getDb, writeTx } from './db';
import { parseTags, restContactStat } from './restLogs';

export type Frequency = 'often' | 'sometimes' | 'rarely';

export type Neighbor = {
  id: string;
  name: string;
  /** 얼굴 0-11 */
  face: number;
  /** 배경색 0-5 */
  color: number;
  relation: Relation;
  frequency: Frequency;
  createdAt: number;
};

export type NeighborWithStats = Neighbor & NeighborContactStat;

type Row = {
  id: string;
  name: string;
  face: number;
  color: number;
  relation: Relation;
  frequency: Frequency;
  created_at: number;
  contact_count: number;
  last_contact: string | null;
};

/** 보관하지 않은 이웃 + 연락 통계 */
export async function listNeighbors(): Promise<NeighborWithStats[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT n.id, n.name, n.face, n.color, n.relation, n.frequency, n.created_at,
            COUNT(c.id) AS contact_count, MAX(c.date) AS last_contact
       FROM neighbor n LEFT JOIN contact c ON c.neighbor_id = n.id
      WHERE n.archived = 0
      GROUP BY n.id
      ORDER BY n.created_at`,
  );
  // 장작 던지기에서 이웃 태그로 만난 날도 만남으로 센다 (기록의 연락과 같은 날이면 한 번)
  const stats = await Promise.all(rows.map((r) => restContactStat(r.id)));
  return rows.map((r, i) => ({
    id: r.id,
    name: r.name,
    face: r.face,
    color: r.color,
    relation: r.relation,
    frequency: r.frequency,
    createdAt: r.created_at,
    contactCount: r.contact_count + stats[i].count,
    lastContact: [r.last_contact, stats[i].last].filter((d): d is string => !!d).sort().pop() ?? null,
  }));
}

export async function insertNeighbor(n: Neighbor): Promise<void> {
  await writeTx(async (db) => {
    await db.runAsync(
    'INSERT INTO neighbor (id, name, face, color, relation, frequency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    n.id,
    n.name,
    n.face,
    n.color,
    n.relation,
    n.frequency,
    n.createdAt,
    );
  });
}

/** 새 이웃 id (기기 안에서만 쓰므로 시각 + 난수로 충분) */
export function newNeighborId(now = Date.now()): string {
  return `n_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function updateNeighbor(n: Omit<Neighbor, 'createdAt'>): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync(
      'UPDATE neighbor SET name = ?, face = ?, color = ?, relation = ?, frequency = ? WHERE id = ?',
      n.name,
      n.face,
      n.color,
      n.relation,
      n.frequency,
      n.id,
    );
  });
}

/** 목록에서 내리기. 지난 기록의 연락은 그대로 남는다. */
export function archiveNeighbor(id: string): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync('UPDATE neighbor SET archived = 1 WHERE id = ?', id);
  });
}

/** 이웃 지우기 (정리, 디자인 13c): 이웃과 같이 쌓은 연락 기록까지 지운다. 이미 심은 작물 · 경험치는 그대로. */
export function deleteNeighbor(id: string): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync('DELETE FROM contact WHERE neighbor_id = ?', id);
    // 쉼 기록의 이웃 태그도 뗀다 (한 줄 글은 그대로)
    const logs = await db.getAllAsync<{ id: string; tags: string }>('SELECT id, tags FROM rest_log WHERE tags LIKE ?', `%"ref":${JSON.stringify(id)}%`);
    for (const l of logs) {
      const kept = parseTags(l.tags).filter((t) => t.ref !== id);
      await db.runAsync('UPDATE rest_log SET tags = ? WHERE id = ?', JSON.stringify(kept), l.id);
    }
    await db.runAsync('DELETE FROM neighbor WHERE id = ?', id);
  });
}
