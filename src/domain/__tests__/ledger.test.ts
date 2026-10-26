import { rec } from '../__fixtures__/records';
import {
  boardEvents,
  eventDaysInMonth,
  eventsInAWeek,
  eventsToday,
  eventsTomorrow,
  nextOccurrence,
  pastEvents,
  upcomingEvents,
  type VillageEvent,
} from '../events';
import {
  canAfford,
  equipSkin,
  exchangeableSkins,
  exchangeHint,
  harvestProgress,
  isSkinLocked,
  payFor,
  planPayment,
  SKINS,
} from '../harvest';

const ev = (id: string, date: string, createdAt = 0, repeatYearly = false): VillageEvent => ({
  id,
  name: id,
  date,
  type: repeatYearly ? 'birth' : 'etc',
  repeatYearly,
  createdAt,
});
const today = '2026-10-20';

describe('행사', () => {
  const events = [ev('b', '2026-11-04'), ev('past', '2026-10-03'), ev('a', '2026-10-27'), ev('today', today)];

  it('다가오는 행사: 오늘 포함, 가까운 순', () => {
    expect(upcomingEvents(events, today).map((e) => e.id)).toEqual(['today', 'a', 'b']);
  });

  it('현수막: 가장 가까운 다가오는 행사 하나', () => {
    expect(boardEvents(events, today)[0]?.id).toBe('today');
    expect(boardEvents([ev('past', '2026-10-01')], today)).toEqual([]);
  });

  it('행사 전날', () => {
    expect(eventsTomorrow([ev('x', '2026-10-21'), ev('y', '2026-10-22')], today).map((e) => e.id)).toEqual(['x']);
  });

  it('지나간 일: 날짜가 지난 행사만, 최근 순 (성취 · 일상 기록 · 시스템 기록은 없음)', () => {
    const items = pastEvents(events, today);
    expect(items.map((i) => i.id)).toEqual(['past']);
    const more = [ev('old', '2026-09-01'), ev('mid', '2026-10-10'), ev('newer', '2026-10-19'), ev('later', '2026-10-25')];
    expect(pastEvents(more, today).map((i) => i.id)).toEqual(['newer', 'mid', 'old']);
  });
});

describe('스킨 교환', () => {
  const skin = (id: string) => SKINS.find((s) => s.id === id)!;

  it('확정 목록 20종 (솔이 9 · 마을 건물 5 · 이장 소품 6)', () => {
    expect(SKINS.filter((s) => s.category === 'soli').map((s) => s.name)).toEqual([
      '밀짚모자', '머리띠', '동글이', '하드', '잠자리채', '꿀잠', '비오는날', '배낭', '헤드셋',
    ]);
    expect(SKINS.filter((s) => s.category === 'building').map((s) => s.name)).toEqual([
      '민트지붕', '우체통', '허수아비', '씨앗창고', '편의점',
    ]);
    expect(SKINS.filter((s) => s.category === 'ijang').map((s) => s.name)).toEqual([
      '선글라스', '부채', '낚싯대', '새마을', '트로트', '트랙터',
    ]);
    for (const gone of ['mailbox', 'jars', 'goldMega', 'sunglasses', 'knitHat']) expect(SKINS.some((s) => s.id === gone)).toBe(false);
  });

  it('커피콩·버섯도 재료로 쓴다 (2026-10-22)', () => {
    expect(skin('phones').cost).toEqual({ crops: { coffee: 6, mushroom: 2 }, any: 0 });
    expect(skin('tractor').cost).toEqual({ crops: { potato: 20, sunflower: 8, mushroom: 3 }, any: 0 });
  });

  it('해금 레벨: 헤드셋 Lv.6 · 편의점 Lv.8 · 트랙터 Lv.10, 나머지는 처음부터', () => {
    expect(SKINS.filter((s) => s.unlockLevel).map((s) => [s.id, s.unlockLevel])).toEqual([
      ['phones', 6],
      ['store', 8],
      ['tractor', 10],
    ]);
    expect(isSkinLocked(skin('phones'), 5)).toBe(true);
    expect(isSkinLocked(skin('phones'), 6)).toBe(false);
    expect(isSkinLocked(skin('hat'), 1)).toBe(false);
  });

  it('지정 작물만: 밀짚모자 = 감자 10 + 해바라기 3', () => {
    expect(canAfford(skin('hat').cost, { potato: 10, sunflower: 3 })).toBe(true);
    expect(canAfford(skin('hat').cost, { potato: 9, sunflower: 3, coffee: 50 })).toBe(false);
    expect(planPayment(skin('hat').cost, { potato: 7 })).toEqual({
      deduct: { potato: 7 },
      lacking: [
        { crop: 'potato', n: 3 },
        { crop: 'sunflower', n: 3 },
      ],
      lackingAny: 0,
    });
  });

  // '아무 작물' 가격은 지금 목록에는 없지만 규칙은 남아 있다
  it('아무 작물: 보유량이 가장 많은 작물부터 다 쓸 때까지 차감', () => {
    const p = planPayment({ crops: {}, any: 12 }, { potato: 4, coffee: 9, strawberry: 2 });
    expect(p.deduct).toEqual({ coffee: 9, potato: 3 });
    expect(p.lackingAny).toBe(0);
  });

  it('지정 + 아무: 지정 작물을 먼저 빼고 남은 것에서 아무 작물', () => {
    const cost = { crops: { strawberry: 6 }, any: 6 };
    const p = planPayment(cost, { strawberry: 9, potato: 2, mushroom: 2 });
    expect(p.deduct).toEqual({ strawberry: 9, potato: 2, mushroom: 1 });
    expect(planPayment(cost, { strawberry: 6, potato: 2 }).lackingAny).toBe(4);
  });

  it('수량이 같으면 감자 → 해바라기 → 딸기 → 커피콩 → 버섯 순', () => {
    expect(planPayment({ crops: {}, any: 20 }, { mushroom: 10, potato: 10, coffee: 10 }).deduct).toEqual({ potato: 10, coffee: 10 });
  });

  it('교환하면 창고 수량만 준다 (누적 수확량 · 수확 레벨은 그대로)', () => {
    expect(payFor(skin('hat').cost, { potato: 12, sunflower: 3, coffee: 1 })).toEqual({ potato: 2, sunflower: 0, coffee: 1 });
    expect(payFor(skin('hat').cost, { potato: 1 })).toBeNull();
    expect(harvestProgress(46).level).toBe(4);
  });

  it('갖고 있지 않고 지금 바꿀 수 있는 스킨만 (분홍 점 · 방송)', () => {
    const inv = { potato: 12, sunflower: 3 };
    expect(exchangeableSkins(inv, new Set(), 4).map((s) => s.id)).toEqual(['hat', 'scarecrow', 'shades', 'fan']);
    expect(exchangeableSkins(inv, new Set(['hat']), 4).map((s) => s.id)).not.toContain('hat');
  });

  it('잠긴 스킨은 작물이 있어도 교환 가능에 넣지 않는다', () => {
    const inv = { potato: 30, sunflower: 10, mushroom: 5 };
    expect(exchangeableSkins(inv, new Set(), 9).map((s) => s.id)).not.toContain('tractor');
    expect(exchangeableSkins(inv, new Set(), 10).map((s) => s.id)).toContain('tractor');
  });

  it('방송 힌트: 가장 많이 드는 지정 작물 / 아무 작물만이면 전체 수량', () => {
    expect(exchangeHint(skin('hat'), { potato: 10, sunflower: 3 })).toEqual({ crop: 'potato', count: 10, skin: '밀짚모자' });
    const anyOnly = { id: 'x', name: '아무거나', category: 'ijang' as const, cost: { crops: {}, any: 12 } };
    expect(exchangeHint(anyOnly, { potato: 5, coffee: 8 })).toEqual({ crop: null, count: 13, skin: '아무거나' });
  });
});

describe('스킨 착용', () => {
  it('쓰면 같은 분류에 쓰던 스킨은 벗고, 다른 분류는 그대로', () => {
    expect([...equipSkin(new Set(['hat', 'barn', 'fan']), 'band')].sort()).toEqual(['band', 'barn', 'fan']);
    expect([...equipSkin(new Set(), 'mic')]).toEqual(['mic']);
  });
  it('모르는 스킨이면 그대로', () => {
    expect([...equipSkin(new Set(['hat']), 'nope')]).toEqual(['hat']);
  });
});

describe('마을 게시판', () => {
  it('가까운 순 최대 3장', () => {
    const events = [ev('d', '2026-12-01'), ev('a', '2026-10-21'), ev('c', '2026-11-01'), ev('b', '2026-10-25')];
    expect(boardEvents(events, today).map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });
  it('오늘 · 내일 · 꼭 일주일 남은 행사', () => {
    const events = [ev('t', today), ev('n', '2026-10-21'), ev('w', '2026-10-27')];
    expect(eventsToday(events, today).map((e) => e.id)).toEqual(['t']);
    expect(eventsTomorrow(events, today).map((e) => e.id)).toEqual(['n']);
    expect(eventsInAWeek(events, today).map((e) => e.id)).toEqual(['w']);
  });
});

describe('매년 반복 (생일·기념일)', () => {
  it('올해 그날이 지났으면 내년 그날', () => {
    const mom = ev('엄마 생신', '2025-03-10', 0, true);
    expect(nextOccurrence(mom, today)).toBe('2027-03-10');
    expect(nextOccurrence(ev('결혼기념일', '2024-11-04', 0, true), today)).toBe('2026-11-04');
    expect(nextOccurrence(ev('오늘', '2020-10-20', 0, true), today)).toBe('2026-10-20');
  });
  it('반복이 아니면 원래 날짜', () => {
    expect(nextOccurrence(ev('시험', '2026-11-19'), today)).toBe('2026-11-19');
  });
  it('처음 날짜보다 앞서지 않는다', () => {
    expect(nextOccurrence(ev('첫 생일', '2027-01-05', 0, true), today)).toBe('2027-01-05');
  });
  it('2월 29일은 평년엔 2월 28일', () => {
    expect(nextOccurrence(ev('윤일', '2024-02-29', 0, true), '2026-10-20')).toBe('2027-02-28');
    expect(nextOccurrence(ev('윤일', '2024-02-29', 0, true), '2027-10-20')).toBe('2028-02-29');
  });
  it('게시판·방송에는 다음에 오는 날짜로, 지나간 일로는 옮기지 않는다', () => {
    const mom = ev('엄마 생신', '2025-10-21', 0, true);
    expect(upcomingEvents([mom], today)[0].date).toBe('2026-10-21');
    expect(eventsTomorrow([mom], today).length).toBe(1);
    expect(pastEvents([mom], today)).toEqual([]);
  });
});

describe('달력의 행사 표시', () => {
  const at = (id: string, date: string, createdAt: number, type: VillageEvent['type'] = 'etc', repeatYearly = false): VillageEvent => ({
    id,
    name: id,
    date,
    type,
    repeatYearly,
    createdAt,
  });
  it('그달 행사 날짜 → 분류, 같은 날이면 먼저 적은 행사', () => {
    const m = eventDaysInMonth([at('b', '2026-10-27', 2, 'travel'), at('a', '2026-10-27', 1, 'work'), at('n', '2026-11-03', 3)], 2026, 10);
    expect([...m]).toEqual([['2026-10-27', 'work']]);
  });
  it('매년 반복은 그해 그날에도, 처음 날짜 전 해에는 안 보인다', () => {
    const mom = at('mom', '2025-11-04', 1, 'birth', true);
    expect([...eventDaysInMonth([mom], 2027, 11)]).toEqual([['2027-11-04', 'birth']]);
    expect(eventDaysInMonth([mom], 2024, 11).size).toBe(0);
  });
});
