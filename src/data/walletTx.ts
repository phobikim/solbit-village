// 지갑 · 옷 구매의 트랜잭션 본문. db를 인자로 받는다 (호출하는 쪽이 트랜잭션을 연다 — src/data/wallet.ts, shop.ts).
// 이 파일은 expo-sqlite를 불러오지 않는다(타입만) → jest에서 node:sqlite를 끼워 규칙을 그대로 시험할 수 있다.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DayKey } from '../domain/day';
import { itemMeta, type Equipped } from '../domain/outfit';
import { applyPurchase, checkPurchase, type PurchaseFail } from '../domain/shop';
import { applyBgPurchase, checkBgPurchase, sanitizeBgOwned, type BgPurchaseFail } from '../domain/villageBg';
import { addToWallet, sanitizeWallet, writeWallet, type Wallet } from '../domain/wallet';

export type Sql = Pick<SQLiteDatabase, 'getFirstAsync' | 'getAllAsync' | 'runAsync'>;

/** 잔액이 모자라거나 값이 이상해서 쓰지 못했다 (아무것도 바뀌지 않는다) */
export class WalletError extends Error {
  constructor() {
    super('wallet: 잔액이 모자라거나 값이 올바르지 않아요');
    this.name = 'WalletError';
  }
}

/** 살 수 없다 (이미 가졌거나 코인이 모자람). 호출한 트랜잭션은 롤백된다 */
export class PurchaseError extends Error {
  constructor(
    readonly reason: PurchaseFail | BgPurchaseFail,
    readonly lack: number,
  ) {
    super(`purchase: ${reason}`);
    this.name = 'PurchaseError';
  }
}

export async function readWallet(db: Sql): Promise<Wallet> {
  const row = await db.getFirstAsync<{ coin: number; heung: number }>('SELECT coin, heung FROM wallet WHERE id = 1');
  return sanitizeWallet(row);
}

async function putWallet(db: Sql, w: Wallet): Promise<void> {
  await db.runAsync(
    'INSERT INTO wallet (id, coin, heung) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET coin = excluded.coin, heung = excluded.heung',
    w.coin,
    w.heung,
  );
}

/** 잔액에 더하거나 뺀다. 결과가 음수가 되면 WalletError — 아무것도 쓰지 않는다 */
export async function addToWalletIn(db: Sql, delta: Partial<Wallet>): Promise<Wallet> {
  const next = addToWallet(await readWallet(db), delta);
  if (!next) throw new WalletError();
  await putWallet(db, next);
  return next;
}

/** 잔액을 통째로 쓴다. 음수 · 정수가 아닌 값이면 WalletError */
export async function writeWalletIn(db: Sql, next: Wallet): Promise<Wallet> {
  const ok = writeWallet(next);
  if (!ok) throw new WalletError();
  await putWallet(db, ok);
  return ok;
}

export type PurchaseResult = { wallet: Wallet; owned: ReadonlySet<string>; equipped: Equipped };

/**
 * 옷 사기 — 한 트랜잭션 안에서: 코인 차감 + 보유 추가 + 그 슬롯에 바로 착용.
 * 살 수 없으면 PurchaseError, 중간에 하나라도 실패하면 예외가 그대로 올라가 호출한 트랜잭션이 전부 되돌린다.
 */
export async function purchaseOutfitIn(db: Sql, itemId: string, day: DayKey): Promise<PurchaseResult> {
  const meta = itemMeta(itemId);
  const wallet = await readWallet(db);
  const ownedRows = await db.getAllAsync<{ item_id: string }>('SELECT item_id FROM outfit_owned');
  const equippedRows = await db.getAllAsync<{ slot: string; item_id: string }>('SELECT slot, item_id FROM outfit_equipped');
  const owned = new Set(ownedRows.map((r) => r.item_id));

  const check = checkPurchase(wallet.coin, owned, itemId);
  if (!check.ok) throw new PurchaseError(check.reason, check.lack);
  if (!meta) throw new PurchaseError('unknown', 0);

  const equipped = Object.fromEntries(equippedRows.map((r) => [r.slot, r.item_id]));
  const after = applyPurchase({ coin: wallet.coin, owned, equipped }, itemId);
  if (!after) throw new PurchaseError('unknown', 0);

  const next = await addToWalletIn(db, { coin: -check.price });
  await db.runAsync('INSERT INTO outfit_owned (item_id, acquired_at, source) VALUES (?, ?, ?)', itemId, day, 'shop');
  await db.runAsync(
    'INSERT INTO outfit_equipped (slot, item_id) VALUES (?, ?) ON CONFLICT(slot) DO UPDATE SET item_id = excluded.item_id',
    meta.slot,
    itemId,
  );
  return { wallet: next, owned: after.owned, equipped: after.equipped };
}

export type BgPurchaseResult = { wallet: Wallet; owned: ReadonlySet<string>; equipped: string };

/** 마을 배경 적용 중 id를 저장하는 settings 키 (src/data/settings.ts SETTING.villageBgEquipped 와 같은 값) */
const BG_EQUIPPED_KEY = 'village_bg_equipped';

/**
 * 마을 배경 사기 — 옷 사기와 같은 한 트랜잭션: 코인 차감 + 보유 추가 + 바로 적용.
 * 살 수 없으면 PurchaseError, 중간에 하나라도 실패하면 예외가 그대로 올라가 호출한 트랜잭션이 전부 되돌린다.
 */
export async function purchaseVillageBgIn(db: Sql, bgId: string, day: DayKey): Promise<BgPurchaseResult> {
  const wallet = await readWallet(db);
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM village_bg_owned');
  const owned = sanitizeBgOwned(rows.map((r) => r.id));

  const check = checkBgPurchase(wallet.coin, owned, bgId);
  if (!check.ok) throw new PurchaseError(check.reason, check.lack);
  const after = applyBgPurchase({ coin: wallet.coin, owned, equipped: bgId }, bgId);
  if (!after) throw new PurchaseError('unknown', 0);

  const next = await addToWalletIn(db, { coin: -check.price });
  await db.runAsync('INSERT INTO village_bg_owned (id, acquired_at, source) VALUES (?, ?, ?)', bgId, day, 'shop');
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    BG_EQUIPPED_KEY,
    bgId,
  );
  return { wallet: next, owned: after.owned, equipped: bgId };
}
