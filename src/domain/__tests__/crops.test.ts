import { cropFor, fieldSlots, FIELD_SIZE, isRipe, planSeed, ripePlantings, stageOf, type Planting } from '../crops';
import { rec } from '../__fixtures__/records';

const meet = [{ neighborId: 'a', method: 'meet' as const }];

describe('작물 결정', () => {
  it('조건별 작물', () => {
    expect(cropFor(rec('d', { condition: 1 }))).toBe('mushroom');
    expect(cropFor(rec('d', { work: 3 }))).toBe('coffee');
    expect(cropFor(rec('d', { contacts: meet }))).toBe('strawberry');
    expect(cropFor(rec('d', { condition: 3, leisure: ['산책'] }))).toBe('sunflower');
    expect(cropFor(rec('d'))).toBe('potato');
  });

  it('신남이어도 여가가 없으면 해바라기가 아니다', () => {
    expect(cropFor(rec('d', { condition: 3 }))).toBe('potato');
  });

  it('겹치면 버섯 > 커피콩 > 딸기 > 해바라기', () => {
    expect(cropFor(rec('d', { condition: 1, work: 3, contacts: meet }))).toBe('mushroom');
    expect(cropFor(rec('d', { condition: 3, work: 3, contacts: meet, leisure: ['영화'] }))).toBe('coffee');
    expect(cropFor(rec('d', { condition: 3, contacts: meet, leisure: ['영화'] }))).toBe('strawberry');
  });

  it('같은 기록이면 항상 같은 작물 (확률 없음)', () => {
    const r = rec('d', { condition: 3, leisure: ['산책'] });
    expect(new Set(Array.from({ length: 20 }, () => cropFor(r)))).toEqual(new Set(['sunflower']));
  });
});

describe('성장 단계 (3일)', () => {
  it('1일차 새싹 → 2일차 → 3일차 익음, 그 뒤로도 익은 채 (시들지 않음)', () => {
    expect(stageOf('2026-10-18', '2026-10-18')).toBe(1);
    expect(stageOf('2026-10-18', '2026-10-19')).toBe(2);
    expect(stageOf('2026-10-18', '2026-10-20')).toBe(3);
    expect(stageOf('2026-10-18', '2026-12-31')).toBe(3);
  });
});

const p = (id: number, plantedDate: string, slot: number, crop: Planting['crop'] = 'potato'): Planting => ({
  id,
  crop,
  plantedDate,
  slot,
});

describe('밭 5칸', () => {
  it('빈 칸이 있으면 가장 앞 빈 칸에 심는다', () => {
    expect(planSeed([])).toEqual({ slot: 0, autoHarvest: null });
    expect(planSeed([p(1, '2026-10-01', 0), p(2, '2026-10-02', 2)])).toEqual({ slot: 1, autoHarvest: null });
  });

  it('꽉 차면 가장 먼저 심은 작물을 자동 수확하고 그 칸에 심는다', () => {
    const full = [
      p(1, '2026-10-03', 0),
      p(2, '2026-10-01', 3, 'strawberry'),
      p(3, '2026-10-02', 1),
      p(4, '2026-10-04', 2),
      p(5, '2026-10-05', 4),
    ];
    expect(full).toHaveLength(FIELD_SIZE);
    const plan = planSeed(full);
    expect(plan.slot).toBe(3);
    expect(plan.autoHarvest?.id).toBe(2);
    expect(plan.autoHarvest?.crop).toBe('strawberry');
  });

  it('하루 1개씩 심으면 자동 수확되는 작물은 항상 익어 있다', () => {
    const today = '2026-10-06';
    const full = [1, 2, 3, 4, 5].map((d, i) => p(i + 1, `2026-10-0${d}`, i));
    expect(isRipe(planSeed(full).autoHarvest!, today)).toBe(true);
  });

  it('fieldSlots: 칸 위치대로, 빈 칸은 null', () => {
    const slots = fieldSlots([p(1, '2026-10-18', 2, 'coffee')], '2026-10-19');
    expect(slots).toEqual([null, null, { crop: 'coffee', stage: 2 }, null, null]);
  });

  it('ripePlantings: 익은 것만, 오래된 순', () => {
    const list = [p(1, '2026-10-19', 0), p(2, '2026-10-10', 1), p(3, '2026-10-18', 2)];
    expect(ripePlantings(list, '2026-10-20').map((x) => x.id)).toEqual([2, 3]);
  });
});
