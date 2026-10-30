// 재화(코인 · 흥) 규칙. 순수 TS. 잔액은 음수가 되지 않는다 (SPEC 19장).
// 읽기 · 쓰기(저장)는 src/data/wallet.ts. 여기서는 "이렇게 바꿔도 되는가"만 계산한다.

export type Wallet = { coin: number; heung: number };

export const EMPTY_WALLET: Wallet = { coin: 0, heung: 0 };

/** 0 이상의 정수인가 (잔액 · 금액 공통) */
export function isAmount(n: unknown): n is number {
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
}

/** 저장돼 있던 값이나 바깥(백업)에서 들어온 값을 믿을 수 있는 잔액으로 고친다. 이상한 값은 0 */
export function sanitizeWallet(raw: { coin?: unknown; heung?: unknown } | null | undefined): Wallet {
  return { coin: isAmount(raw?.coin) ? raw.coin : 0, heung: isAmount(raw?.heung) ? raw.heung : 0 };
}

/**
 * 잔액에 더하거나(양수) 뺀다(음수). 결과가 음수가 되거나 정수가 아니면 거부한다(null).
 * 새 객체를 돌려준다 (원본은 바꾸지 않는다).
 */
export function addToWallet(w: Wallet, delta: Partial<Wallet>): Wallet | null {
  const coin = w.coin + (delta.coin ?? 0);
  const heung = w.heung + (delta.heung ?? 0);
  return isAmount(coin) && isAmount(heung) ? { coin, heung } : null;
}

/** 값을 통째로 쓴다. 음수 · 정수가 아닌 값이면 거부한다(null) */
export function writeWallet(next: Wallet): Wallet | null {
  return isAmount(next.coin) && isAmount(next.heung) ? { coin: next.coin, heung: next.heung } : null;
}

/** 모자란 만큼 (충분하면 0) */
export function shortBy(have: number, price: number): number {
  return Math.max(0, price - have);
}

/** 천 단위 콤마 (Intl이 없는 환경에서도 같게 나오도록 직접 만든다) */
export function formatCount(n: number): string {
  const v = Math.trunc(n);
  return String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace(/^/, v < 0 ? '-' : '');
}
