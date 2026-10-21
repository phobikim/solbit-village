import { rec } from '../__fixtures__/records';
import { achievementsOf, bannerEvent, eventsTomorrow, pastItems, upcomingEvents, type VillageEvent } from '../events';
import {
  canAfford,
  equipSkin,
  exchangeableSkins,
  exchangeHint,
  harvestProgress,
  NON_INGREDIENT_CROPS,
  NON_INGREDIENT_EXCEPTIONS,
  payFor,
  planPayment,
  SKINS,
} from '../harvest';

const ev = (id: string, date: string, createdAt = 0): VillageEvent => ({ id, name: id, date, type: 'schedule', createdAt });
const today = '2026-10-20';

describe('행사', () => {
  const events = [ev('b', '2026-11-04'), ev('past', '2026-10-03'), ev('a', '2026-10-27'), ev('today', today)];

  it('다가오는 행사: 오늘 포함, 가까운 순', () => {
    expect(upcomingEvents(events, today).map((e) => e.id)).toEqual(['today', 'a', 'b']);
  });

  it('현수막: 가장 가까운 다가오는 행사 하나', () => {
    expect(bannerEvent(events, today)?.id).toBe('today');
    expect(bannerEvent([ev('past', '2026-10-01')], today)).toBeNull();
  });

  it('행사 전날', () => {
    expect(eventsTomorrow([ev('x', '2026-10-21'), ev('y', '2026-10-22')], today).map((e) => e.id)).toEqual(['x']);
  });

  it('지나간 일: 지난 행사 + 성취, 최근 순 (일상 기록·시스템 기록은 없음)', () => {
    const achievements = achievementsOf([
      rec('2026-10-20', { achievement: '배포 완료', memo: '일상 메모' }),
      rec('2026-10-10', { memo: '메모만' }),
      rec('2026-10-05', { achievement: '시험 접수' }),
    ]);
    expect(achievements).toEqual([
      { date: '2026-10-20', text: '배포 완료' },
      { date: '2026-10-05', text: '시험 접수' },
    ]);
    const items = pastItems(events, achievements, today);
    expect(items.map((i) => (i.kind === 'event' ? `e:${i.event.id}` : `a:${i.text}`))).toEqual([
      'a:배포 완료',
      'a:시험 접수',
      'e:past',
    ]);
  });
});

describe('스킨 교환', () => {
  const skin = (id: string) => SKINS.find((s) => s.id === id)!;

  it('확정 목록 11종 (솔이 5 · 마을 건물 3 · 이장 소품 3), 커피 앞치마·버섯 우산 없음', () => {
    expect(SKINS.map((s) => s.name)).toEqual([
      '밀짚모자', '딸기 머리띠', '동글이 안경', '하드', '잠자리채',
      '허수아비', '빨간 우체통', '장독대',
      '금색 확성기', '선글라스', '털모자',
    ]);
  });

  it('커피콩·버섯은 지정 재료로 쓰지 않는다 (규칙 3) — 예외는 잠자리채의 커피콩뿐', () => {
    for (const s of SKINS) {
      if (NON_INGREDIENT_EXCEPTIONS.includes(s.id)) continue;
      for (const c of NON_INGREDIENT_CROPS) expect(s.cost.crops[c]).toBeUndefined();
    }
    expect(NON_INGREDIENT_EXCEPTIONS).toEqual(['net']);
    expect(skin('net').cost).toEqual({ crops: { coffee: 4, sunflower: 2 }, any: 0 });
    for (const s of SKINS) expect(s.cost.crops.mushroom).toBeUndefined();
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

  it('아무 작물: 보유량이 가장 많은 작물부터 다 쓸 때까지 차감', () => {
    // 털모자 = 아무 12
    const p = planPayment(skin('knitHat').cost, { potato: 4, coffee: 9, strawberry: 2 });
    expect(p.deduct).toEqual({ coffee: 9, potato: 3 });
    expect(p.lackingAny).toBe(0);
  });

  it('지정 + 아무: 지정 작물을 먼저 빼고 남은 것에서 아무 작물', () => {
    // 빨간 우체통 = 딸기 6 + 아무 6
    const p = planPayment(skin('mailbox').cost, { strawberry: 9, potato: 2, mushroom: 2 });
    expect(p.deduct).toEqual({ strawberry: 9, potato: 2, mushroom: 1 });
    expect(planPayment(skin('mailbox').cost, { strawberry: 6, potato: 2 }).lackingAny).toBe(4);
  });

  it('수량이 같으면 감자 → 해바라기 → 딸기 → 커피콩 → 버섯 순', () => {
    expect(planPayment(skin('jars').cost, { mushroom: 10, potato: 10, coffee: 10 }).deduct).toEqual({ potato: 10, coffee: 10 });
  });

  it('교환하면 창고 수량만 준다 (누적 수확량 · 수확 레벨은 그대로)', () => {
    expect(payFor(skin('hat').cost, { potato: 12, sunflower: 3, coffee: 1 })).toEqual({ potato: 2, sunflower: 0, coffee: 1 });
    expect(payFor(skin('hat').cost, { potato: 1 })).toBeNull();
    expect(harvestProgress(46).level).toBe(4);
  });

  it('갖고 있지 않고 지금 바꿀 수 있는 스킨만 (분홍 점 · 방송)', () => {
    const inv = { potato: 12, sunflower: 3 };
    expect(exchangeableSkins(inv, new Set()).map((s) => s.id)).toEqual(['hat', 'scarecrow', 'goldMega', 'knitHat']);
    expect(exchangeableSkins(inv, new Set(['hat'])).map((s) => s.id)).not.toContain('hat');
  });

  it('방송 힌트: 지정 작물 / 아무 작물만이면 전체 수량', () => {
    expect(exchangeHint(skin('hat'), { potato: 10, sunflower: 3 })).toEqual({ crop: 'potato', count: 10, skin: '밀짚모자' });
    expect(exchangeHint(skin('knitHat'), { potato: 5, coffee: 8 })).toEqual({ crop: null, count: 13, skin: '털모자' });
  });
});

describe('스킨 착용', () => {
  it('쓰면 같은 분류에 쓰던 스킨은 벗고, 다른 분류는 그대로', () => {
    expect([...equipSkin(new Set(['hat', 'jars', 'goldMega']), 'band')].sort()).toEqual(['band', 'goldMega', 'jars']);
    expect([...equipSkin(new Set(), 'knitHat')]).toEqual(['knitHat']);
  });
  it('모르는 스킨이면 그대로', () => {
    expect([...equipSkin(new Set(['hat']), 'nope')]).toEqual(['hat']);
  });
});
