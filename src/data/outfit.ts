// 솔이네 옷장 저장소: 가진 옷 · 입고 있는 옷. 옷은 장식일 뿐이라 다른 데이터에 영향을 주지 않는다.

import { today } from '../domain/day';
import { isKnownItem, itemMeta, sanitizeEquipped, STARTS_OWNED, type Equipped, type Slot } from '../domain/outfit';
import { getDb, writeTx } from './db';
import { getSetting, SETTING } from './settings';

/** 지금 가진 옷 id (카탈로그에 없는 id는 뺀다) */
export async function getOwned(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ item_id: string }>('SELECT item_id FROM outfit_owned');
  return new Set(rows.map((r) => r.item_id).filter(isKnownItem));
}

/** 마지막에 저장한 착용 상태. 모르는 옷 · 이제 없는 옷은 뺀다 */
export async function getEquipped(): Promise<Equipped> {
  const db = await getDb();
  const [rows, owned] = await Promise.all([
    db.getAllAsync<{ slot: string; item_id: string }>('SELECT slot, item_id FROM outfit_equipped'),
    getOwned(),
  ]);
  return sanitizeEquipped(Object.fromEntries(rows.map((r) => [r.slot, r.item_id])), owned);
}

/** 착용 상태를 통째로 바꿔 저장한다 (한 트랜잭션). 모르는 옷은 저장하지 않는다 */
export function setEquipped(equipped: Equipped): Promise<void> {
  const rows = Object.entries(equipped).filter(([slot, id]) => id !== undefined && itemMeta(id)?.slot === slot);
  return writeTx(async (db) => {
    await db.runAsync('DELETE FROM outfit_equipped');
    for (const [slot, id] of rows) await db.runAsync('INSERT INTO outfit_equipped (slot, item_id) VALUES (?, ?)', slot, id);
  });
}

/**
 * 처음 가진 옷(STARTS_OWNED)을 한 번만 넣는다. 이미 넣었으면(settings.outfit_seeded) 아무것도 하지 않는다.
 * 백업 가져오기는 설정도 같이 바꾸므로, 옷장이 없던 예전 백업을 가져오면 다시 넣는다.
 */
export async function seedOwned(now: Date = new Date()): Promise<void> {
  if ((await getSetting(SETTING.outfitSeeded)) === '1') return;
  const day = today(now);
  await writeTx(async (db) => {
    for (const id of STARTS_OWNED) {
      await db.runAsync('INSERT OR IGNORE INTO outfit_owned (item_id, acquired_at, source) VALUES (?, ?, ?)', id, day, 'start');
    }
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      SETTING.outfitSeeded,
      '1',
    );
  });
}

/** 한 슬롯의 착용만 바꿔 바로 저장한다. itemId가 null이면 그 슬롯을 벗는다 */
export function setSlot(slot: Slot, itemId: string | null): Promise<void> {
  if (itemId !== null && itemMeta(itemId)?.slot !== slot) return Promise.resolve();
  return writeTx(async (db) => {
    if (itemId === null) await db.runAsync('DELETE FROM outfit_equipped WHERE slot = ?', slot);
    else
      await db.runAsync(
        'INSERT INTO outfit_equipped (slot, item_id) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET item_id = excluded.item_id',
        slot,
        itemId,
      );
  });
}

/**
 * 개발자 전용: 가진 옷을 처음 6벌(STARTS_OWNED)로 되돌린다. 옷 가게를 다시 시험하는 용도.
 * 입고 있던 옷 중 이제 없는 것은 벗긴다. (보유는 줄지 않는 것이 앱의 규칙이라, 화면에는 개발 모드에서만 노출한다)
 */
export function devResetOwnedToStart(now: Date = new Date()): Promise<void> {
  const day = today(now);
  return writeTx(async (db) => {
    await db.runAsync('DELETE FROM outfit_owned');
    for (const id of STARTS_OWNED) {
      await db.runAsync('INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES (?, ?, ?)', id, day, 'start');
    }
    await db.runAsync(
      `DELETE FROM outfit_equipped WHERE item_id NOT IN (${STARTS_OWNED.map(() => '?').join(', ')})`,
      ...STARTS_OWNED,
    );
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      SETTING.outfitSeeded,
      '1',
    );
  });
}
