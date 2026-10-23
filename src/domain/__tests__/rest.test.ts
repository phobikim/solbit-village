import { byDate, rec } from '../__fixtures__/records';
import type { VillageEvent } from '../events';
import { leisureIndex } from '../indices';
import {
  clampNights,
  footprintFor,
  grindStreak,
  keptDays,
  markVisited,
  placeYearAgo,
  restSignal,
  samePlace,
  scheduledDate,
  settleTrips,
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
  duration: 'half',
  visited: false,
  memo: null,
  note: null,
  eventId: null,
  logId: null,
  visitedDate: null,
  nights: 0,
  addedDate: '2026-10-01',
  createdAt: 0,
  ...over,
});
const trip = (id: string, visitedDate: string, nights: number, over: Partial<Place> = {}) =>
  place(id, { visited: true, visitedDate, nights, ...over });
const event = (id: string, date: string, over: Partial<VillageEvent> = {}): VillageEvent => ({
  id,
  name: '사파 여행',
  date,
  type: 'travel',
  repeatYearly: false,
  createdAt: 0,
  ...over,
});

describe('다녀온 곳 → 통나무로 세는 날 (n박 범위)', () => {
  it('출발일 ~ 출발일 + n박, 당일치기는 하루', () => {
    expect([...tripDays([trip('제주', '2026-10-18', 3)])]).toEqual(['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21']);
    expect([...tripDays([trip('양평', '2026-10-05', 0)])]).toEqual(['2026-10-05']);
  });
  it('달 · 해를 넘겨도 이어진다', () => {
    expect([...tripDays([trip('삿포로', '2026-12-30', 3)])]).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
  });
  it('깃발 · 날짜 없는 곳은 빼고, 겹치는 여행은 한 번씩', () => {
    const days = tripDays([trip('a', '2026-10-10', 2), trip('b', '2026-10-11', 1), place('wish'), trip('x', '', 0, { visitedDate: null })]);
    expect([...days].sort()).toEqual(['2026-10-10', '2026-10-11', '2026-10-12']);
  });
  it('장작 던지기에서 찍은 발자국은 통나무로 세지 않는다 (그날은 장작 기록이 센다)', () => {
    expect(tripDays([trip('한강', '2026-10-20', 0, { logId: 'rl_1' })]).size).toBe(0);
  });
  it('다녀온 날은 통나무(35)로 쉼 지수에 반영된다', () => {
    const trips = tripDays([trip('강릉', '2026-10-19', 1)]); // 19 · 20일
    const r = byDate(rec('2026-10-21'));
    expect(leisureIndex(r, '2026-10-21')).toBe(0);
    expect(leisureIndex(r, '2026-10-21', { logs: [], trips })).toBe(70);
  });
  it('다녀온 곳은 기록이 아니다: 기록에 손대지 않는다', () => {
    const r = byDate(rec('2026-10-19'));
    const before = JSON.stringify(r);
    leisureIndex(r, '2026-10-21', { logs: [], trips: tripDays([trip('강릉', '2026-10-19', 1)]) });
    expect(JSON.stringify(r)).toBe(before);
  });
});

describe('이번 주', () => {
  it('월요일부터 센다', () => {
    expect(weekStart(today)).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // 일요일은 그 주의 끝
  });
});

describe('가고 싶은 곳(깃발)', () => {
  const places = [place('카페', { createdAt: 1 }), place('바다', { createdAt: 2 }), trip('제주', '2025-10-19', 3)];
  it('깃발만, 오래 담아둔 순', () => {
    expect(wishList(places).map((p) => p.id)).toEqual(['카페', '바다']);
  });
  it('[다녀왔슈]: 날짜 · 몇 박 · 소감을 붙여 발자국으로', () => {
    const v = markVisited(place('정자', { memo: '도시락', eventId: 'ev' }), today, 2, '  바람 좋음 ');
    expect(v).toMatchObject({ visited: true, visitedDate: today, nights: 2, note: '바람 좋음', memo: '도시락', eventId: null });
    expect(markVisited(place('x'), today, 99, '  ').note).toBeNull();
    expect(clampNights(-1)).toBe(0);
  });
  it('담아둔 지 며칠', () => {
    expect(keptDays(place('x', { addedDate: '2026-10-08' }), today)).toBe(14);
  });
});

describe('깃발 → 발자국 전환 (날짜 잡은 깃발)', () => {
  const flag = place('사파', { eventId: 'ev1', nights: 2, createdAt: 5 }); // 10.27 출발 2박 → 10.29까지
  const ev = event('ev1', '2026-10-27');
  it('행사 날(마지막 날)이 지나기 전에는 그대로', () => {
    expect(settleTrips([flag], [ev], '2026-10-26')).toEqual([]);
    expect(settleTrips([flag], [ev], '2026-10-27')).toEqual([]);
    expect(settleTrips([flag], [ev], '2026-10-29')).toEqual([]);
  });
  it('마지막 날 다음 날부터 발자국: 출발일 · 박 수가 다녀온 곳이 되어 머문 날마다 통나무', () => {
    const [moved] = settleTrips([flag], [ev], '2026-10-30');
    expect(moved).toMatchObject({ id: '사파', visited: true, visitedDate: '2026-10-27', nights: 2, eventId: null, createdAt: 5 });
    expect([...tripDays([moved])]).toEqual(['2026-10-27', '2026-10-28', '2026-10-29']);
    // 7일 안 3일 × 35 = 105 → 상한 100
    expect(leisureIndex({}, '2026-10-30', { logs: [], trips: tripDays([moved]) })).toBe(100);
  });
  it('당일치기 깃발은 다음 날 발자국', () => {
    const day = place('양평', { eventId: 'ev2', nights: 0 });
    expect(settleTrips([day], [event('ev2', '2026-10-21')], '2026-10-21')).toEqual([]);
    expect(settleTrips([day], [event('ev2', '2026-10-21')], '2026-10-22')).toHaveLength(1);
  });
  it('행사를 지워 날짜가 사라진 깃발은 평범한 깃발로 돌아온다', () => {
    const [back] = settleTrips([flag], [], today);
    expect(back).toMatchObject({ visited: false, eventId: null, nights: 0 });
  });
  it('날짜 없는 깃발 · 이미 발자국인 곳 · 매년 반복 행사는 건드리지 않는다', () => {
    expect(settleTrips([place('a'), trip('b', '2026-01-01', 0), flag], [event('ev1', '2020-01-01', { repeatYearly: true })], today)).toEqual([]);
  });
  it('날짜 잡힌 깃발의 날짜 보기', () => {
    expect(scheduledDate(flag, [ev], today)).toBe('2026-10-27');
    expect(scheduledDate(flag, [ev], '2026-10-28')).toBeNull();
  });
});

describe('장작 던지기의 장소 → 발자국', () => {
  it('보따리에 같은 이름 깃발이 있으면 그 깃발이 발자국이 된다 (띄어쓰기 무시)', () => {
    const flag = place('한 강', { id: 'f1', createdAt: 3 });
    const p = footprintFor('한강', '2026-10-20', 'rl_1', [flag], 'new', 9);
    expect(p).toMatchObject({ id: 'f1', visited: true, visitedDate: '2026-10-20', nights: 0, logId: 'rl_1', createdAt: 3 });
  });
  it('없으면 새 발자국 (당일치기)', () => {
    const p = footprintFor(' 한강 ', '2026-10-20', 'rl_1', [], 'new', 9);
    expect(p).toMatchObject({ id: 'new', name: '한강', visited: true, visitedDate: '2026-10-20', nights: 0, logId: 'rl_1', createdAt: 9 });
    expect(samePlace('한 강', '한강')).toBe(true);
  });
  it('이미 다녀온 곳이면 새 발자국을 하나 더 (n번 감)', () => {
    const old = trip('한강', '2026-08-01', 0, { id: 'v1' });
    const p = footprintFor('한강', '2026-10-20', 'rl_1', [old], 'new', 9);
    expect(p.id).toBe('new');
    expect(visitCounts([old, p]).get('new')).toBe(2);
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
    expect([...visitCounts(visited)]).toEqual([['제주2', 3]]);
  });
  it('[또 가고 싶슈]: 깃발로 복사, 이미 있으면 안 함', () => {
    const copy = wishAgain(visited[1], visited, 'new', today, 9);
    expect(copy).toMatchObject({ id: 'new', name: '양평', visited: false, visitedDate: null, note: null, logId: null, addedDate: today });
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
  it('1년 전 오늘', () => {
    expect(placeYearAgo([trip('제주', '2025-10-19', 3)], today)?.id).toBe('제주');
    expect(yearAgo('2028-02-29')).toBe('2027-02-28');
  });
});
