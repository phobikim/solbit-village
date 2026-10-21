import {
  autoHarvestDay,
  cropFor,
  dueForAutoHarvest,
  fieldSlots,
  FIELD_SIZE,
  isRipe,
  planSeed,
  stageOf,
  type Planting,
} from '../crops';
import { dayKeyOf } from '../day';
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

});

describe('자동 수확', () => {
  // 10-18 심음: 18 새싹 → 19 자라는 중 → 20 다 익음(반짝) → 21 하루가 시작될 때(04:00) 자동 수확
  const planted = p(1, '2026-10-18', 0, 'strawberry');

  it('심은 날 새싹 → 다음 날 자라는 중 → 이틀 뒤 다 익음 → 사흘째 수확', () => {
    expect(stageOf('2026-10-18', '2026-10-18')).toBe(1);
    expect(stageOf('2026-10-18', '2026-10-19')).toBe(2);
    expect(isRipe(planted, '2026-10-20')).toBe(true);
    expect(autoHarvestDay('2026-10-18')).toBe('2026-10-21');
    expect(dueForAutoHarvest([planted], '2026-10-19')).toEqual([]);
    expect(dueForAutoHarvest([planted], '2026-10-20')).toEqual([]); // 다 익은 날은 하루 동안 밭에 있다
    expect(dueForAutoHarvest([planted], '2026-10-21')).toEqual([planted]);
  });

  it('하루 경계(04:00) 직전엔 아직 밭에, 직후엔 수확', () => {
    const at = (h: number, m: number) => dayKeyOf(new Date(2026, 9, 21, h, m));
    expect(at(3, 59)).toBe('2026-10-20');
    expect(dueForAutoHarvest([planted], at(3, 59))).toEqual([]);
    expect(at(4, 0)).toBe('2026-10-21');
    expect(dueForAutoHarvest([planted], at(4, 0))).toEqual([planted]);
    // 21일 자정 넘어 새벽 1시: 아직 20일 → 반짝이는 채로
    expect(isRipe(planted, dayKeyOf(new Date(2026, 9, 21, 1, 0)))).toBe(true);
  });

  it('며칠 만에 앱을 열면 밀린 수확을 한 번에 (오래된 순), 아직 안 익은 것은 남긴다', () => {
    const field = [
      p(3, '2026-10-12', 2, 'potato'),
      p(1, '2026-10-10', 0, 'mushroom'),
      p(2, '2026-10-11', 1, 'coffee'),
      p(4, '2026-10-17', 3, 'sunflower'), // 20일 수확 날
      p(5, '2026-10-18', 4, 'strawberry'), // 21일 수확 날
    ];
    expect(dueForAutoHarvest(field, '2026-10-20').map((x) => x.id)).toEqual([1, 2, 3, 4]);
  });

  it('하루 1개씩 기록하면 밭은 많아야 3칸 → 꽉 차는 건 지난날 빈칸 기록 때뿐', () => {
    const today = '2026-10-20';
    const daily = [p(1, '2026-10-17', 0), p(2, '2026-10-18', 1), p(3, '2026-10-19', 2), p(4, today, 3)];
    const left = daily.filter((x) => !dueForAutoHarvest(daily, today).includes(x));
    expect(left.length).toBe(3);
    expect(planSeed(left).autoHarvest).toBeNull();
  });

  it('꽉 찬 밭(지난날 빈칸을 한꺼번에 채운 날)에서는 가장 오래된 작물을 대신 딴다', () => {
    const today = '2026-10-20';
    const full = [1, 2, 3, 4, 5].map((i) => p(i, today, i - 1));
    expect(dueForAutoHarvest(full, today)).toEqual([]);
    expect(planSeed(full)).toEqual({ slot: 0, autoHarvest: full[0] });
  });
});
