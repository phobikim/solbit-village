import {
  computeIndices,
  healthIndex,
  leisureBand,
  leisureIndex,
  relationBand,
  relationIndex,
  workBand,
  workIndex,
} from '../indices';
import { weatherNow } from '../weather';
import { byDate, rec } from '../__fixtures__/records';

const today = '2026-10-20';

describe('건강 지수: 컨디션 가중 평균 (최근일 무겁게)', () => {
  it('기록 없으면 null', () => expect(healthIndex({}, today)).toBeNull());
  it('모두 신남이면 100, 모두 지침이면 0', () => {
    expect(healthIndex(byDate(rec(today, { condition: 3 }), rec('2026-10-19', { condition: 3 })), today)).toBe(100);
    expect(healthIndex(byDate(rec(today, { condition: 1 })), today)).toBe(0);
  });
  it('최근일이 더 무겁다: 오늘 신남 + 6일 전 지침 → 87', () => {
    // (100*7 + 0*1) / 8 = 87.5 → 88
    expect(healthIndex(byDate(rec(today, { condition: 3 }), rec('2026-10-14', { condition: 1 })), today)).toBe(88);
  });
  it('7일보다 오래된 기록은 안 본다', () => {
    expect(healthIndex(byDate(rec('2026-10-13', { condition: 3 })), today)).toBeNull();
  });
});

describe('일 지수: 강도 평균 (1→20, 2→55, 3→90)', () => {
  it('평균', () => {
    expect(workIndex(byDate(rec(today, { work: 3 }), rec('2026-10-19', { work: 1 })), today)).toBe(55);
  });
  it('단계', () => {
    expect(workBand(90)).toBe('overtime');
    expect(workBand(60)).toBe('busy');
    expect(workBand(40)).toBe('normal');
    expect(workBand(20)).toBe('easy');
  });
});

describe('관계 지수: 연락 수 점수와 연락 주기 충족 비율의 평균', () => {
  const contact = (id: string) => ({ neighborId: id, method: 'call' as const });

  it('이웃이 없으면 null', () => expect(relationIndex({}, [], today)).toBeNull());

  it('연락 5번 이상 + 모든 이웃 주기 충족 → 100', () => {
    const records = byDate(rec(today, { contacts: [contact('a'), contact('b'), contact('a')] }), rec('2026-10-18', { contacts: [contact('a'), contact('b')] }));
    const neighbors = [
      { id: 'a', frequency: 'often' as const, lastContact: today },
      { id: 'b', frequency: 'rarely' as const, lastContact: '2026-08-01' },
    ];
    expect(relationIndex(records, neighbors, today)).toBe(100);
  });

  it('연락 0번 + 주기 절반 충족 → 25', () => {
    const neighbors = [
      { id: 'a', frequency: 'sometimes' as const, lastContact: '2026-10-01' },
      { id: 'b', frequency: 'often' as const, lastContact: '2026-10-01' },
    ];
    expect(relationIndex(byDate(rec(today)), neighbors, today)).toBe(25);
  });

  it('최근 7일 기록이 없으면 null', () => {
    expect(relationIndex({}, [{ id: 'a', frequency: 'often', lastContact: today }], today)).toBeNull();
  });

  it('과거 시점 계산엔 그 뒤의 연락을 쓰지 않는다', () => {
    const records = byDate(rec('2026-09-29'), rec(today, { contacts: [contact('a')] }));
    const neighbors = [{ id: 'a', frequency: 'often' as const, lastContact: today }];
    expect(relationIndex(records, neighbors, '2026-09-29')).toBe(0);
    expect(relationIndex(records, neighbors, today)).toBe(60); // (1/5 + 1) / 2
  });

  it('단계: 단짝이 있으면 단짝 있음', () => {
    expect(relationBand(10, true)).toBe('bestFriend');
    expect(relationBand(70, false)).toBe('lively');
    expect(relationBand(10, false)).toBe('quiet');
  });
});

describe('쉼 지수: 모닥불 (최근 7일 장작 점수 합) — 자세한 건 fire.test.ts', () => {
  it('기록의 여가 칩만으로는 점수가 없다 (쉼 기록이 있어야 한다)', () => {
    const records = byDate(rec(today, { leisure: ['산책'] }), rec('2026-10-17'));
    expect(leisureIndex(records, today)).toBe(0);
  });
  it('장작 점수', () => {
    const log = (id: string, date: string, size: 'twig' | 'firewood' | 'log') => ({ id, date, text: '', tags: [], size, createdAt: 0 });
    const rest = { logs: [log('a', today, 'firewood'), log('b', '2026-10-17', 'twig')], trips: new Set<string>() };
    expect(leisureIndex({}, today, rest)).toBe(30);
  });
  it('단계', () => {
    expect(leisureBand(80)).toBe('blaze');
    expect(leisureBand(50)).toBe('burning');
    expect(leisureBand(24)).toBe('dying');
    expect(leisureBand(10)).toBe('out');
  });
});

describe('computeIndices', () => {
  it('4개를 한 번에', () => {
    const r = computeIndices(byDate(rec(today, { condition: 2, work: 2 })), [], today);
    expect(r).toEqual({ health: 50, work: 55, relation: null, leisure: 0 });
  });
});

describe('지금 날씨', () => {
  it('오늘 기록이 없어도 최근 3일 평균', () => {
    expect(weatherNow(today, { '2026-10-19': 3, '2026-10-18': 3 })).toBe('sun');
    expect(weatherNow(today, { '2026-10-19': 1 })).toBe('storm');
    expect(weatherNow(today, { '2026-10-10': 3 })).toBeNull();
  });
});
