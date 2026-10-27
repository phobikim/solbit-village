import { shouldShowWake, wakePhase } from '../morning';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi);

describe('shouldShowWake', () => {
  it('한 번도 마치지 않았으면 보인다 (null)', () => {
    expect(shouldShowWake(null, at(2026, 10, 27, 9))).toBe(true);
  });
  it('오늘 이미 마쳤으면 안 보인다', () => {
    expect(shouldShowWake('2026-10-27', at(2026, 10, 27, 9))).toBe(false);
  });
  it('어제 마쳤으면 보인다 (날짜 바뀜)', () => {
    expect(shouldShowWake('2026-10-26', at(2026, 10, 27, 9))).toBe(true);
  });
  it('경계 03:59는 아직 전날 — 전날 마쳤으면 안 보인다', () => {
    expect(shouldShowWake('2026-10-26', at(2026, 10, 27, 3, 59))).toBe(false);
  });
  it('경계 04:00부터 새 하루 — 전날 마쳤어도 보인다', () => {
    expect(shouldShowWake('2026-10-26', at(2026, 10, 27, 4, 0))).toBe(true);
  });
  it('자정을 넘긴 새벽에 오늘(전날 키)을 마쳤으면 안 보인다', () => {
    expect(shouldShowWake('2026-10-27', at(2026, 10, 28, 1, 0))).toBe(false);
  });
});

describe('wakePhase', () => {
  it('04:00~10:59는 morning', () => {
    expect(wakePhase(at(2026, 10, 27, 4, 0))).toBe('morning');
    expect(wakePhase(at(2026, 10, 27, 10, 59))).toBe('morning');
  });
  it('11:00부터는 midday', () => {
    expect(wakePhase(at(2026, 10, 27, 11, 0))).toBe('midday');
    expect(wakePhase(at(2026, 10, 27, 23, 30))).toBe('midday');
  });
  it('00:00~03:59는 전날의 늦은 시각이라 midday', () => {
    expect(wakePhase(at(2026, 10, 27, 3, 59))).toBe('midday');
  });
});
