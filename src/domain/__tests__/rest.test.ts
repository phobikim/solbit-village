import { byDate, rec } from '../__fixtures__/records';
import {
  grindStreak,
  keptDays,
  lastRestDay,
  placeYearAgo,
  restDaysThisWeek,
  restSignal,
  scheduledDate,
  sortPlaces,
  weekStart,
  yearAgo,
  type Place,
} from '../rest';

const today = '2026-10-22'; // 목요일

const place = (id: string, over: Partial<Place> = {}): Place => ({
  id,
  name: id,
  duration: 'short',
  visited: false,
  eventId: null,
  visitedDate: null,
  nights: 0,
  addedDate: '2026-10-01',
  createdAt: 0,
  ...over,
});

describe('지침 신호 (일 · 쉼 · 건강 셋 다)', () => {
  it('일 80 이상 + 쉼 20 이하 + 흐림 이하면 켜진다', () => {
    expect(restSignal(85, 14, 'over')).toBe(true);
    expect(restSignal(80, 20, 'storm')).toBe(true);
  });
  it('하나라도 아니면 꺼진다', () => {
    expect(restSignal(79, 14, 'rain')).toBe(false);
    expect(restSignal(90, 21, 'rain')).toBe(false);
    expect(restSignal(90, 0, 'cloud')).toBe(false);
    expect(restSignal(null, 0, 'rain')).toBe(false);
    expect(restSignal(90, 0, null)).toBe(false);
  });
});

describe('갈려나간 날 이어짐', () => {
  it('최근 기록부터 일 강도 3이 이어진 날 수', () => {
    const r = byDate(rec('2026-10-18', { work: 3 }), rec('2026-10-19', { work: 3 }), rec('2026-10-20', { work: 3 }), rec('2026-10-21', { work: 3 }), rec('2026-10-22', { work: 3 }));
    expect(grindStreak(r, today)).toBe(5);
  });
  it('오늘 아직 안 적었으면 어제부터, 빈 날에서 끊긴다', () => {
    const r = byDate(rec('2026-10-19', { work: 3 }), rec('2026-10-21', { work: 3 }));
    expect(grindStreak(r, today)).toBe(1);
    expect(grindStreak(byDate(rec('2026-10-22', { work: 2 })), today)).toBe(0);
  });
});

describe('마지막 쉼 · 이번 주 쉰 날', () => {
  const r = byDate(
    rec('2026-10-17', { leisure: ['산책'] }), // 지난주 토요일
    rec('2026-10-19', { leisure: ['영화'] }), // 이번 주 월요일
    rec('2026-10-21'),
    rec('2026-10-22', { leisure: ['휴식'] }),
  );
  it('쉼을 적은 가장 최근 날', () => {
    expect(lastRestDay(r, today)).toBe('2026-10-22');
    expect(lastRestDay(r, '2026-10-20')).toBe('2026-10-19');
    expect(lastRestDay({}, today)).toBeNull();
  });
  it('월요일부터 오늘까지 쉼을 적은 날', () => {
    expect(weekStart(today)).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // 일요일은 그 주의 끝
    expect(restDaysThisWeek(r, today)).toBe(2);
  });
});

describe('보따리', () => {
  const places = [
    place('정자', { duration: 'short', createdAt: 1 }),
    place('공원', { duration: 'short', createdAt: 2 }),
    place('양평', { duration: 'half', createdAt: 3 }),
    place('사파', { duration: 'weekend', createdAt: 4, eventId: 'ev1' }),
    place('제주', { duration: 'weekend', visited: true, visitedDate: '2025-10-19', nights: 3, createdAt: 5 }),
  ];
  it('가고 싶은 곳은 오래 담은 순, 다녀온 곳은 최근 순', () => {
    expect(sortPlaces(places, false).map((p) => p.id)).toEqual(['정자', '공원', '양평', '사파']);
    const v = [place('a', { visited: true, visitedDate: '2025-01-01' }), place('b', { visited: true, visitedDate: '2026-05-01' })];
    expect(sortPlaces(v, true).map((p) => p.id)).toEqual(['b', 'a']);
  });
  it('담아둔 지 며칠', () => {
    expect(keptDays(place('x', { addedDate: '2026-10-08' }), today)).toBe(14);
  });
  it('1년 전 오늘 다녀오던 곳 (출발일 ~ 박 수)', () => {
    expect(placeYearAgo(places, today)?.id).toBe('제주'); // 2025-10-19 + 3박 → 10-22까지
    expect(placeYearAgo(places, '2026-10-23')).toBeNull();
    expect(yearAgo('2028-02-29')).toBe('2027-02-28');
  });
});

describe('날짜 잡힌 곳', () => {
  const ev = { id: 'ev1', name: '사파', date: '2026-10-27', type: 'travel' as const, repeatYearly: false, createdAt: 0 };
  it('이은 여행 행사가 아직 안 지났을 때만 날짜', () => {
    expect(scheduledDate(place('사파', { eventId: 'ev1' }), [ev], today)).toBe('2026-10-27');
    expect(scheduledDate(place('사파', { eventId: 'ev1' }), [ev], '2026-10-28')).toBeNull();
    expect(scheduledDate(place('사파', { eventId: 'gone' }), [ev], today)).toBeNull();
  });
});
