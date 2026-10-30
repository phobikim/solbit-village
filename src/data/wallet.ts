// 재화(코인 · 흥) 저장소: 잔액 읽기 · 더하기 · 쓰기. 규칙은 src/domain/wallet.ts, 트랜잭션 본문은 walletTx.ts.
// 쓰기는 잔액이 모자라거나 값이 이상하면 WalletError로 거부하고, 아무것도 바꾸지 않는다 (음수가 되지 않는다).
// 지급 로직(저녁 기록 저장 시)은 아직 없다 — 개발자 항목(devSeed)으로만 채운다.

import type { Wallet } from '../domain/wallet';
import { getDb, writeTx } from './db';
import { addToWalletIn, readWallet, writeWalletIn } from './walletTx';

export { PurchaseError, WalletError } from './walletTx';

export async function getWallet(): Promise<Wallet> {
  return readWallet(await getDb());
}

/** 더하거나(양수) 뺀다(음수). 모자라면 WalletError */
export async function addToWalletDb(delta: Partial<Wallet>): Promise<Wallet> {
  let out!: Wallet;
  await writeTx(async (db) => {
    out = await addToWalletIn(db, delta);
  });
  return out;
}

/** 통째로 쓴다. 음수면 WalletError */
export async function setWalletDb(next: Wallet): Promise<Wallet> {
  let out!: Wallet;
  await writeTx(async (db) => {
    out = await writeWalletIn(db, next);
  });
  return out;
}
