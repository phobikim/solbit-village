import {
  MILESTONE_LEVELS,
  playEnergyForLevel,
  progressRatio,
  rewardRow,
  rewardStatus,
  rewardTableLevels,
  salaryForLevel,
} from '../rewards';
import { unlockForLevel, VILLAGE_UNLOCKS } from '../villageUnlocks';

describe('salaryForLevel', () => {
  it('Lv.1 = 100, 레벨 하나당 +10', () => {
    expect(salaryForLevel(1)).toBe(100);
    expect(salaryForLevel(2)).toBe(110);
    expect(salaryForLevel(7)).toBe(160);
    expect(salaryForLevel(12)).toBe(210);
  });
  it('상한 없이 식이 이어진다', () => {
    expect(salaryForLevel(50)).toBe(590);
  });
  it('1 미만 · 소수 · NaN 은 보정', () => {
    expect(salaryForLevel(0)).toBe(100);
    expect(salaryForLevel(-5)).toBe(100);
    expect(salaryForLevel(7.9)).toBe(160);
    expect(salaryForLevel(Number.NaN)).toBe(100);
  });
});

describe('playEnergyForLevel', () => {
  it('Lv.1~5 = 10 … 레벨 5마다 +2 (식: 10 + floor((Lv-1)/5) × 2)', () => {
    for (const lv of [1, 2, 3, 4, 5]) expect(playEnergyForLevel(lv)).toBe(10);
    for (const lv of [6, 7, 8, 9, 10]) expect(playEnergyForLevel(lv)).toBe(12);
    for (const lv of [11, 12, 13, 14, 15]) expect(playEnergyForLevel(lv)).toBe(14);
    expect(playEnergyForLevel(16)).toBe(16);
  });
  it('1 미만은 1로 본다', () => {
    expect(playEnergyForLevel(0)).toBe(10);
    expect(playEnergyForLevel(-3)).toBe(10);
  });
});

describe('rewardRow', () => {
  it('특별 보상은 Lv.5 · Lv.10', () => {
    expect([...MILESTONE_LEVELS]).toEqual([5, 10]);
    expect(rewardRow(5).milestone).toBe(true);
    expect(rewardRow(10).milestone).toBe(true);
    for (const lv of [1, 4, 6, 9, 11, 12, 13]) expect(rewardRow(lv).milestone).toBe(false);
  });
  it('월급 · 기력 · 해금을 한 줄로 묶는다', () => {
    expect(rewardRow(7)).toEqual({ level: 7, salary: 160, energy: 12, unlock: { id: 'well', icon: 'well' }, milestone: false });
  });
  it('표에 없는 레벨은 해금 null 이어도 금액은 이어진다', () => {
    const r = rewardRow(13);
    expect(r.unlock).toBeNull();
    expect(r.salary).toBe(220);
    expect(r.energy).toBe(14);
  });
  it('0 · 음수는 Lv.1 줄', () => {
    expect(rewardRow(0).level).toBe(1);
    expect(rewardRow(-4)).toEqual(rewardRow(1));
  });
});

describe('villageUnlocks', () => {
  it('Lv.1~12 샘플 12개, 레벨 순서대로', () => {
    expect(VILLAGE_UNLOCKS).toHaveLength(12);
    expect(unlockForLevel(1)?.id).toBe('house');
    expect(unlockForLevel(5)?.id).toBe('plazaOutfit');
    expect(unlockForLevel(10)?.id).toBe('festivalOutfit');
    expect(unlockForLevel(12)?.id).toBe('observatory');
    expect(unlockForLevel(13)).toBeNull();
    expect(unlockForLevel(0)).toBeNull();
  });
  it('id가 겹치지 않는다', () => {
    expect(new Set(VILLAGE_UNLOCKS.map((u) => u.id)).size).toBe(VILLAGE_UNLOCKS.length);
  });
});

describe('보상표 목록', () => {
  it('Lv.1 ~ max(12, 현재 + 3)', () => {
    expect(rewardTableLevels(1)).toHaveLength(12);
    expect(rewardTableLevels(7)).toHaveLength(12);
    expect(rewardTableLevels(9)).toHaveLength(12);
    expect(rewardTableLevels(10)).toHaveLength(13);
    expect(rewardTableLevels(20).at(-1)).toBe(23);
    expect(rewardTableLevels(7)[0]).toBe(1);
  });
  it('지난 / 지금 / 앞으로', () => {
    expect(rewardStatus(6, 7)).toBe('past');
    expect(rewardStatus(7, 7)).toBe('current');
    expect(rewardStatus(8, 7)).toBe('future');
  });
});

describe('progressRatio', () => {
  it('0~1 로 맞춘다', () => {
    expect(progressRatio(31, 50)).toBeCloseTo(0.62);
    expect(progressRatio(0, 50)).toBe(0);
    expect(progressRatio(80, 50)).toBe(1);
    expect(progressRatio(-3, 50)).toBe(0);
    expect(progressRatio(5, 0)).toBe(0);
  });
});
