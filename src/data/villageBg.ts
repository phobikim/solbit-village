// 마을 배경 저장소: 가진 배경 · 적용 중인 배경. 배경은 장식일 뿐이라 다른 데이터에 영향을 주지 않는다.

import { today } from '../domain/day';
import { BG_BASE, isKnownBg, sanitizeBgEquipped, sanitizeBgOwned } from '../domain/villageBg';
import { getDb, writeTx } from './db';
import { getSetting, SETTING } from './settings';
import { purchaseVillageBgIn, type BgPurchaseResult } from './walletTx';

export { PurchaseError } from './walletTx';
export type { BgPurchaseResult };

/** 지금 가진 배경 id (모르는 id는 뺀다, 기본은 늘 가진다) */
export async function getBgOwned(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM village_bg_owned');
  return sanitizeBgOwned(rows.map((r) => r.id));
}

/** 적용 중인 배경. 저장값이 없거나 모르거나 안 가진 배경이면 기본 */
export async function getBgEquipped(owned?: ReadonlySet<string>): Promise<string> {
  const [saved, have] = await Promise.all([getSetting(SETTING.villageBgEquipped), owned ?? getBgOwned()]);
  return sanitizeBgEquipped(saved, have);
}

/** 가진 배경으로 바꿔 바로 저장한다. 모르는 배경은 저장하지 않는다 */
export function setBgEquipped(id: string): Promise<void> {
  if (!isKnownBg(id)) return Promise.resolve();
  return writeTx(async (db) => {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      SETTING.villageBgEquipped,
      id,
    );
  });
}

/** 배경 사기: 한 트랜잭션 (코인 차감 + 보유 + 적용) */
export async function purchaseVillageBg(id: string, now: Date = new Date()): Promise<BgPurchaseResult> {
  let out!: BgPurchaseResult;
  await writeTx(async (db) => {
    out = await purchaseVillageBgIn(db, id, today(now));
  });
  return out;
}

/** 개발자 전용: 가진 배경을 기본 하나로 되돌린다 (배경 구매를 다시 시험하는 용도) */
export function devResetBgToStart(): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync('DELETE FROM village_bg_owned');
    await db.runAsync("INSERT INTO village_bg_owned (id, acquired_at, source) VALUES (?, NULL, 'start')", BG_BASE);
    await db.runAsync('DELETE FROM settings WHERE key = ?', SETTING.villageBgEquipped);
  });
}
