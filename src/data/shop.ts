// 옷 가게: 옷 사기. 코인 차감 + 보유 추가 + 그 슬롯에 바로 착용을 한 트랜잭션으로 한다 (하나라도 실패하면 전부 되돌린다).

import { today } from '../domain/day';
import { writeTx } from './db';
import { purchaseOutfitIn, type PurchaseResult } from './walletTx';

export { PurchaseError } from './walletTx';
export type { PurchaseResult };

export async function purchaseOutfit(itemId: string, now: Date = new Date()): Promise<PurchaseResult> {
  let out!: PurchaseResult;
  await writeTx(async (db) => {
    out = await purchaseOutfitIn(db, itemId, today(now));
  });
  return out;
}
