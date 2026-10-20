// 2026-10-20 확정 규칙: 낮/밤 · 수확 레벨 · 해금 · 이웃 가까움 · 추세
import { byDate, rec } from '../__fixtures__/records';
import { timeOfDayAt } from '../day';
import { harvestProgress } from '../harvest';
import { trendBand, weeklyTrend } from '../indices';
import { bestFriendOf, closenessOf, closenessRatio, monthContactCount } from '../neighbors';
import { isUnlocked, UNLOCK_LEVEL } from '../village';

describe('낮/밤: 06:00 ~ 18:59 낮', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 20, h, m);
  it('경계', () => {
    expect(timeOfDayAt(at(5, 59))).toBe('night');
    expect(timeOfDayAt(at(6, 0))).toBe('day');
    expect(timeOfDayAt(at(18, 59))).toBe('day');
    expect(timeOfDayAt(at(19, 0))).toBe('night');
  });
  it('하루 경계(04시)와 별개: 새벽 3시는 밤', () => expect(timeOfDayAt(at(3))).toBe('night'));
});

describe('수확 레벨: 레벨당 15개', () => {
  it('레벨과 다음 목표', () => {
    expect(harvestProgress(0)).toEqual({ level: 1, title: '주말 농부', total: 0, nextAt: 15 });
    expect(harvestProgress(14).level).toBe(1);
    expect(harvestProgress(15).level).toBe(2);
    expect(harvestProgress(46)).toEqual({ level: 4, title: '동네 농부', total: 46, nextAt: 60 });
  });
  it('칭호: Lv.1 주말 / Lv.4 동네 / Lv.7 소문난 / Lv.10 이장이 견제하는', () => {
    expect(harvestProgress(44).title).toBe('주말 농부'); // Lv.3
    expect(harvestProgress(45).title).toBe('동네 농부'); // Lv.4
    expect(harvestProgress(89).title).toBe('동네 농부'); // Lv.6
    expect(harvestProgress(90).title).toBe('소문난 농부'); // Lv.7
    expect(harvestProgress(135).title).toBe('이장이 견제하는 농부'); // Lv.10
    expect(harvestProgress(9999).title).toBe('이장이 견제하는 농부');
  });
});

describe('해금: 발견한 패턴만 마을 Lv.10', () => {
  it('패턴 외에는 잠금 대상이 없다', () => expect(Object.keys(UNLOCK_LEVEL)).toEqual(['patterns']));
  it('Lv.9 잠김, Lv.10 열림', () => {
    expect(isUnlocked('patterns', 9)).toBe(false);
    expect(isUnlocked('patterns', 10)).toBe(true);
  });
});

describe('이웃 가까움: 경과일 ÷ 기준일', () => {
  const today = '2026-10-20';
  it('자주(7일): 3일 → 가까움, 7일 → 보통, 14일 → 뜸함, 15일 → 안부', () => {
    const c = (last: string) => closenessOf(closenessRatio('often', last, '2026-01-01', today));
    expect(c('2026-10-17')).toBe('close'); // 3/7 = 0.43
    expect(c('2026-10-16')).toBe('normal'); // 4/7 = 0.57
    expect(c('2026-10-13')).toBe('normal'); // 7/7 = 1
    expect(c('2026-10-06')).toBe('distant'); // 14/7 = 2
    expect(c('2026-10-05')).toBe('askAfter'); // 15/7
  });
  it('가끔 30일 · 드물게 90일 기준', () => {
    expect(closenessOf(closenessRatio('sometimes', '2026-10-05', '2026-01-01', today))).toBe('close'); // 15/30
    expect(closenessOf(closenessRatio('rarely', '2026-08-01', '2026-01-01', today))).toBe('normal'); // 80/90
  });
  it('연락한 적 없으면 등록한 날부터', () => {
    expect(closenessOf(closenessRatio('often', null, '2026-10-19', today))).toBe('close');
    expect(closenessOf(closenessRatio('often', null, '2026-09-01', today))).toBe('askAfter');
  });
  it('이번 달 연락 횟수와 단짝(1위, 동률이면 최근)', () => {
    const c = (id: string) => ({ neighborId: id, method: 'meet' as const });
    const records = byDate(
      rec('2026-10-01', { contacts: [c('a')] }),
      rec('2026-10-03', { contacts: [c('b')] }),
      rec('2026-09-30', { contacts: [c('b'), c('b')] }),
    );
    expect(monthContactCount(records, { year: 2026, month: 10 }, 'b')).toBe(1);
    expect(bestFriendOf(records, { year: 2026, month: 10 })).toBe('b');
  });
});

describe('최근 4주 추세', () => {
  it('주별 지수와 추세 단계', () => {
    const records = byDate(rec('2026-09-29', { work: 1 }), rec('2026-10-20', { work: 3 }));
    expect(weeklyTrend('work', records, [], '2026-10-20')).toEqual([20, null, null, 90]);
    expect(trendBand([20, null, null, 90])).toBe('up');
    expect(trendBand([50, 52, 48, 47])).toBe('flat');
    expect(trendBand([60, 55, 50, 52])).toBe('slightlyDown');
    expect(trendBand([null, 40, null, null])).toBe('unknown');
  });
});
