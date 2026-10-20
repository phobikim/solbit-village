import { rec } from '../__fixtures__/records';
import { achievementsOf, bannerEvent, eventsTomorrow, pastItems, upcomingEvents, type VillageEvent } from '../events';
import { canAfford, exchangeableSkins, exchangeHint, harvestProgress, lackingFor, payFor, SKINS } from '../harvest';

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
  const hat = SKINS.find((s) => s.id === 'hat')!;

  it('작물 수량만으로 교환 (확률 없음)', () => {
    expect(canAfford(hat.cost, { potato: 10, sunflower: 3 })).toBe(true);
    expect(canAfford(hat.cost, { potato: 9, sunflower: 3 })).toBe(false);
  });

  it('모자란 작물과 개수', () => {
    expect(lackingFor(hat.cost, { potato: 7 })).toEqual([
      { crop: 'potato', n: 3 },
      { crop: 'sunflower', n: 3 },
    ]);
  });

  it('교환하면 창고 수량만 준다 (누적 수확량 · 수확 레벨은 그대로)', () => {
    expect(payFor(hat.cost, { potato: 12, sunflower: 3, coffee: 1 })).toEqual({ potato: 2, sunflower: 0, coffee: 1 });
    expect(payFor(hat.cost, { potato: 1 })).toBeNull();
    // 수확 레벨은 누적 수확량으로만 계산하므로 교환과 무관
    expect(harvestProgress(46).level).toBe(4);
  });

  it('갖고 있지 않고 지금 바꿀 수 있는 스킨만 (분홍 점 · 방송)', () => {
    const inv = { potato: 10, sunflower: 5, strawberry: 8 };
    expect(exchangeableSkins(inv, new Set()).map((s) => s.id)).toEqual(['hat', 'band']);
    expect(exchangeableSkins(inv, new Set(['hat'])).map((s) => s.id)).toEqual(['band']);
  });

  it('방송 힌트: 가장 많이 드는 작물과 지금 수량', () => {
    expect(exchangeHint(hat, { potato: 10, sunflower: 3 })).toEqual({ crop: 'potato', count: 10, skin: '밀짚모자' });
  });
});
