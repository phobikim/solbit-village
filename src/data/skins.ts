// 스킨 저장소: 교환(창고 작물 차감) · 쓰기/벗기.
// 교환은 창고 수량만 줄인다. 누적 수확량(harvest_stat)과 수확 레벨은 그대로.

import { payFor, SKINS, type Inventory } from '../domain/harvest';
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

/** 교환. 작물이 모자라거나 이미 있으면 false. */
export function exchangeSkin(skinId: string): Promise<boolean> {
  const skin = SKINS.find((s) => s.id === skinId);
  let ok = false;
  if (!skin) return Promise.resolve(false);
  return writeTx(async (db) => {
    const has = await db.getFirstAsync<{ owned: number }>('SELECT owned FROM skin WHERE id = ?', skinId);
    if (has?.owned) return;
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
    ok = true;
  }).then(() => ok);
}

/** 쓰기/벗기. 같은 분류(솔이 등)에서는 하나만 쓴다. */
export function setSkinEquipped(skinId: string, equipped: boolean): Promise<void> {
  const skin = SKINS.find((s) => s.id === skinId);
  if (!skin) return Promise.resolve();
  return writeTx(async (db) => {
    if (equipped) {
      const sameCategory = SKINS.filter((s) => s.category === skin.category).map((s) => s.id);
      for (const id of sameCategory) await db.runAsync('UPDATE skin SET equipped = 0 WHERE id = ?', id);
    }
    await db.runAsync('UPDATE skin SET equipped = ? WHERE id = ? AND owned = 1', equipped ? 1 : 0, skinId);
  });
}
