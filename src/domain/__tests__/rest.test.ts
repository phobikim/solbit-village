import { byDate, rec } from '../__fixtures__/records';
import { computeIndices, leisureIndex, weeklyTrend } from '../indices';
import {
  clampNights,
  grindStreak,
  isRestDay,
  keptDays,
  lastRestDay,
  markVisited,
  placeYearAgo,
  restDaysThisWeek,
  restSignal,
  restSuggestions,
  restWeek,
  scheduledDate,
  tripDays,
  visitCounts,
  visitedList,
  weekStart,
  wishAgain,
  wishList,
  yearAgo,
  type Place,
} from '../rest';

const today = '2026-10-22'; // 목요일

const place = (id: string, over: Partial<Place> = {}): Place => ({
  id,
  name: id,
  duration: 'short',
  visited: false,
  memo: null,
  note: null,
  eventId: null,
  visitedDate: null,
  nights: 0,
  addedDate: '2026-10-01',
  createdAt: 0,
  ...over,
});
const trip = (id: string, visitedDate: string, nights: number, over: Partial<Place> = {}) =>
  place(id, { visited: true, visitedDate, nights, ...over });

describe('다녀온 곳 → 쉰 날 (n박 범위)', () => {
  it('출발일 ~ 출발일 + n박, 당일치기는 하루', () => {
    expect([...tripDays([trip('제주', '2026-10-18', 3)])]).toEqual(['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21']);
    expect([...tripDays([trip('양평', '2026-10-05', 0)])]).toEqual(['2026-10-05']);
  });
  it('달 · 해를 넘겨도 이어진다', () => {
    expect([...tripDays([trip('삿포로', '2026-12-30', 3)])]).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });
  it('가고 싶은 곳 · 날짜 없는 곳은 빼고, 겹치는 여행은 한 번씩', () => {
    const days = tripDays([trip('a', '2026-10-10', 2), trip('b', '2026-10-11', 1), place('wish'), trip('x', '', 0, { visitedDate: null })]);
    expect([...days].sort()).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
  });
});

describe('쉼 지수에 반영 (중복 없이)', () => {
  const trips = tripDays([trip('강릉', '2026-10-19', 1)]); // 19 · 20일
  it('기록에 쉼이 없어도 다녀온 날은 쉰 날', () => {
    const r = byDate(rec('2026-10-19'), rec('2026-10-20'), rec('2026-10-21'));
    expect(leisureIndex(r, '2026-10-21')).toBe(0);
    expect(leisureIndex(r, '2026-10-21', trips)).toBe(29); // 2/7
  });
  it('같은 날 기록에도 쉼이 있으면 한 번만 센다', () => {
    const r = byDate(rec('2026-10-19', { leisure: ['산책'] }), rec('2026-10-20', { leisure: ['영화'] }), rec('2026-10-21', { leisure: ['휴식'] }));
    expect(leisureIndex(r, '2026-10-21')).toBe(43); // 3/7
    expect(leisureIndex(r, '2026-10-21', trips)).toBe(43);
  });
  it('기록이 없는 날 다녀왔어도 지수가 생긴다 (기록 · 여행 둘 다 없으면 null)', () => {
    expect(leisureIndex({}, '2026-10-21', trips)).toBe(29);
    expect(leisureIndex({}, '2026-10-21')).toBeNull();
  });
  it('마을 지수 · 4주 추세에도 같은 값', () => {
    expect(computeIndices({}, [], '2026-10-21', trips).leisure).toBe(29);
    expect(weeklyTrend('leisure', {}, [], '2026-10-21', trips).at(-1)).toBe(29);
  });
  it('다녀온 곳은 기록이 아니다: 기록 · 작물에는 손대지 않는다', () => {
    const r = byDate(rec('2026-10-19'));
    const before = JSON.stringify(r);
    isRestDay('2026-10-19', r, trips);
    leisureIndex(r, '2026-10-21', trips);
    expect(JSON.stringify(r)).toBe(before);
  });
});

describe('쉼 상태 카드: 이번 주 7칸 · 마지막 쉼', () => {
  const r = byDate(rec('2026-10-17', { leisure: ['산책'] }), rec('2026-10-19', { leisure: ['영화'] }), rec('2026-10-21'));
  const trips = tripDays([trip('공원', '2026-10-21', 0)]);
  it('월 ~ 일 7칸, 쉰 날만 true, 아직 안 온 날은 false', () => {
    expect(weekStart(today)).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // 일요일은 그 주의 끝
    expect(restWeek(r, trips, today)).toEqual([true, false, true, false, false, false, false]);
    expect(restDaysThisWeek(r, today, trips)).toBe(2);
  });
  it('마지막 쉼 = 기록의 쉼과 다녀온 날 중 가장 최근 (미래 제외)', () => {
    expect(lastRestDay('2026-10-19', trips, today)).toBe('2026-10-21');
    expect(lastRestDay('2026-10-19', new Set(['2026-10-30']), today)).toBe('2026-10-19');
    expect(lastRestDay(null, new Set(), today)).toBeNull();
  });
});

describe('가고 싶은 곳', () => {
  const places = [
    place('카페', { duration: 'half', createdAt: 1 }),
    place('바다', { duration: 'weekend', createdAt: 2 }),
    place('정자', { duration: 'short', createdAt: 3 }),
    trip('제주', '2025-10-19', 3),
  ];
  it('걸리는 시간으로 거르기', () => {
    expect(wishList(places, 'all', 'half').map((p) => p.id)).toEqual(['카페', '바다', '정자']);
    expect(wishList(places, 'weekend', 'half').map((p) => p.id)).toEqual(['바다']);
  });
  it('쉼이 봉오리 이하이면 30분이 맨 위', () => {
    expect(wishList(places, 'all', 'bud').map((p) => p.id)).toEqual(['정자', '카페', '바다']);
    expect(wishList(places, 'all', 'none')[0].id).toBe('정자');
    expect(wishList(places, 'all', null)[0].id).toBe('카페');
  });
  it('[다녀왔슈]: 날짜 · 몇 박 · 소감을 붙여 다녀온 곳으로', () => {
    const v = markVisited(place('정자', { memo: '도시락' }), today, 2, '  바람 좋음 ');
    expect(v).toMatchObject({ visited: true, visitedDate: today, nights: 2, note: '바람 좋음', memo: '도시락' });
    expect(markVisited(place('x'), today, 99, '  ').note).toBeNull();
    expect(clampNights(-1)).toBe(0);
  });
  it('담아둔 지 며칠', () => {
    expect(keptDays(place('x', { addedDate: '2026-10-08' }), today)).toBe(14);
  });
});

describe('다녀온 곳', () => {
  const visited = [
    trip('제주', '2025-10-19', 3, { createdAt: 1 }),
    trip('양평', '2026-08-02', 0, { createdAt: 2 }),
    trip('제 주', '2026-05-01', 1, { createdAt: 3 }),
    trip('제주', '2026-09-10', 2, { createdAt: 4, id: '제주2' }),
  ];
  it('최신순', () => {
    expect(visitedList(visited).map((p) => p.visitedDate)).toEqual(['2026-09-10', '2026-08-02', '2026-05-01', '2025-10-19']);
  });
  it('같은 장소 재방문: 가장 최근 카드에만 n번 감 (띄어쓰기 무시)', () => {
    const c = visitCounts(visited);
    expect([...c]).toEqual([['제주2', 3]]);
  });
  it('[또 가고 싶슈]: 가고 싶은 곳에 복사, 이미 있으면 안 함', () => {
    const copy = wishAgain(visited[1], visited, 'new', today, 9);
    expect(copy).toMatchObject({ id: 'new', name: '양평', visited: false, visitedDate: null, note: null, addedDate: today });
    expect(wishAgain(visited[1], [...visited, place('양평')], 'new', today, 9)).toBeNull();
  });
});

describe('꺼 둔 기능 (코드만 남김)', () => {
  it('지침 신호: 일 80 이상 + 쉼 20 이하 + 흐림 이하', () => {
    expect(restSignal(85, 14, 'over')).toBe(true);
    expect(restSignal(79, 14, 'rain')).toBe(false);
    expect(restSignal(90, 0, 'cloud')).toBe(false);
  });
  it('갈려나간 날 이어짐', () => {
    const r = byDate(rec('2026-10-20', { work: 3 }), rec('2026-10-21', { work: 3 }));
    expect(grindStreak(r, today)).toBe(2);
  });
  it('오늘의 쉼 제안: 시간마다 하나, 날마다 차례로', () => {
    const places = [place('정자', { createdAt: 1 }), place('공원', { createdAt: 2 }), place('양평', { duration: 'half', createdAt: 3 })];
    expect(restSuggestions(places, today).map((p) => p.duration)).toEqual(['short', 'half']);
    expect(restSuggestions(places, '2026-10-23')[0].id).not.toBe(restSuggestions(places, today)[0].id);
  });
  it('1년 전 오늘', () => {
    expect(placeYearAgo([trip('제주', '2025-10-19', 3)], today)?.id).toBe('제주');
    expect(yearAgo('2028-02-29')).toBe('2027-02-28');
  });
  it('날짜 잡기', () => {
    const ev = { id: 'ev1', name: '사파', date: '2026-10-27', type: 'travel' as const, repeatYearly: false, createdAt: 0 };
    expect(scheduledDate(place('사파', { eventId: 'ev1' }), [ev], today)).toBe('2026-10-27');
    expect(scheduledDate(place('사파', { eventId: 'ev1' }), [ev], '2026-10-28')).toBeNull();
  });
});
