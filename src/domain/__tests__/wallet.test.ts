import { addToWallet, EMPTY_WALLET, formatCount, isAmount, sanitizeWallet, shortBy, writeWallet } from '../wallet';

describe('지갑 규칙', () => {
  it('처음은 코인 0 · 흥 0', () => {
    expect(EMPTY_WALLET).toEqual({ coin: 0, heung: 0 });
  });

  it('더하고 뺀다 (원본은 그대로)', () => {
    const w = { coin: 100, heung: 10 };
    expect(addToWallet(w, { coin: 100 })).toEqual({ coin: 200, heung: 10 });
    expect(addToWallet(w, { heung: 10, coin: -40 })).toEqual({ coin: 60, heung: 20 });
    expect(w).toEqual({ coin: 100, heung: 10 });
  });

  it('모자라면 거부한다 (null) — 음수가 되지 않는다', () => {
    expect(addToWallet({ coin: 100, heung: 0 }, { coin: -101 })).toBeNull();
    expect(addToWallet({ coin: 100, heung: 0 }, { heung: -1 })).toBeNull();
    expect(addToWallet({ coin: 100, heung: 0 }, { coin: -100 })).toEqual({ coin: 0, heung: 0 });
  });

  it('정수가 아닌 값 · NaN은 거부한다', () => {
    expect(addToWallet(EMPTY_WALLET, { coin: 1.5 })).toBeNull();
    expect(addToWallet(EMPTY_WALLET, { coin: Number.NaN })).toBeNull();
  });

  it('쓰기는 음수 · 이상한 값이면 거부한다', () => {
    expect(writeWallet({ coin: 5, heung: 3 })).toEqual({ coin: 5, heung: 3 });
    expect(writeWallet({ coin: -1, heung: 3 })).toBeNull();
    expect(writeWallet({ coin: 1, heung: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it('저장돼 있던 값이 이상하면 0으로 고친다', () => {
    expect(sanitizeWallet({ coin: -5, heung: '9' })).toEqual({ coin: 0, heung: 0 });
    expect(sanitizeWallet(null)).toEqual({ coin: 0, heung: 0 });
    expect(sanitizeWallet({ coin: 680, heung: 42 })).toEqual({ coin: 680, heung: 42 });
    expect(isAmount(0)).toBe(true);
    expect(isAmount(-0.5)).toBe(false);
  });

  it('모자란 만큼', () => {
    expect(shortBy(380, 800)).toBe(420);
    expect(shortBy(800, 800)).toBe(0);
    expect(shortBy(900, 800)).toBe(0);
  });

  it('천 단위 콤마', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(680)).toBe('680');
    expect(formatCount(1280)).toBe('1,280');
    expect(formatCount(1234567)).toBe('1,234,567');
  });
});
