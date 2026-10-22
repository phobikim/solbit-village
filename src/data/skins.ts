// 스킨 저장소: 교환(창고 작물 차감 + 바로 착용) · 쓰기/벗기.
// 교환은 창고 수량만 줄인다. 누적 수확량(harvest_stat)과 수확 레벨은 그대로.

import type { SQLiteDatabase } from 'expo-sqlite';

import { equipSkin, harvestProgress, isSkinLocked, payFor, SKINS, type Inventory } from '../domain/harvest';
import type { CropKind } from '../domain/types';
import { getDb, writeTx } from './db';

export type SkinState = { owned: Set<string>; equipped: Set<string> };

export async function loadSkins(): Promise<SkinState> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; owned: number; equipped: number }>('SELECT * FROM skin');
  return {
    owned: new Set(rows.filter((r) => r.owned).map((r) => r.id)),
    equipped: new Set(rows.filter((r) => r.equipped).map((r) => r.id)),
  };
}

/** 트랜잭션 안에서: 이 스킨을 쓰고, 같은 분류에 쓰던 스킨은 벗는다 */
async function equipTx(db: SQLiteDatabase, skinId: string): Promise<void> {
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM skin WHERE equipped = 1');
  const before = new Set(rows.map((r) => r.id));
  const after = equipSkin(before, skinId);
  for (const id of before) if (!after.has(id)) await db.runAsync('UPDATE skin SET equipped = 0 WHERE id = ?', id);
  await db.runAsync('UPDATE skin SET equipped = 1 WHERE id = ? AND owned = 1', skinId);
}

/** 교환하고 바로 쓴다. 작물이 모자라거나, 수확 레벨이 모자라거나, 이미 있으면 false. */
export function exchangeSkin(skinId: string): Promise<boolean> {
  const skin = SKINS.find((s) => s.id === skinId);
  let ok = false;
  if (!skin) return Promise.resolve(false);
  return writeTx(async (db) => {
    const has = await db.getFirstAsync<{ owned: number }>('SELECT owned FROM skin WHERE id = ?', skinId);
    if (has?.owned) return;
    const stat = await db.getFirstAsync<{ total_harvested: number }>('SELECT total_harvested FROM harvest_stat WHERE id = 1');
    if (isSkinLocked(skin, harvestProgress(stat?.total_harvested ?? 0).level)) return;
    const rows = await db.getAllAsync<{ crop: CropKind; qty: number }>('SELECT crop, qty FROM inventory');
    const inv: Inventory = Object.fromEntries(rows.map((r) => [r.crop, r.qty]));
    const next = payFor(skin.cost, inv);
    if (!next) return;
    // 지정 작물 + '아무 작물'로 실제 줄어든 작물만 다시 쓴다
    for (const crop of Object.keys(next) as CropKind[]) {
      if (next[crop] !== inv[crop]) await db.runAsync('UPDATE inventory SET qty = ? WHERE crop = ?', next[crop] ?? 0, crop);
    }
    await db.runAsync(
      'INSERT INTO skin (id, owned, equipped) VALUES (?, 1, 0) ON CONFLICT(id) DO UPDATE SET owned = 1',
      skinId,
    );
    await equipTx(db, skinId);
    ok = true;
  }).then(() => ok);
}

/** 쓰기(같은 분류에 쓰던 스킨은 벗김) / 벗기 */
export function setSkinEquipped(skinId: string, equipped: boolean): Promise<void> {
  if (!SKINS.some((s) => s.id === skinId)) return Promise.resolve();
  return writeTx(async (db) => {
    if (equipped) await equipTx(db, skinId);
    else await db.runAsync('UPDATE skin SET equipped = 0 WHERE id = ?', skinId);
  });
}
