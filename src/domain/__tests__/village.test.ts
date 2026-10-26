import { areasEntered, levelFromXp, xpDelta, xpForRecord, xpToNext } from '../village';
import { rec } from '../__fixtures__/records';

describe('마을 경험치: 기록 +10, 영역 입력마다 +5', () => {
  it('컨디션·일 강도만 → 20', () => {
    expect(areasEntered(rec('d'))).toBe(2);
    expect(xpForRecord(rec('d'))).toBe(20);
  });
  it('관계·여가까지 → 30', () => {
    const r = rec('d', { contacts: [{ neighborId: 'a', method: 'meet' }], leisure: ['산책'] });
    expect(xpForRecord(r)).toBe(30);
  });
  it('메모는 영역이 아니라 경험치를 더 주지 않는다', () => {
    expect(xpForRecord(rec('d', { memo: '메모' }))).toBe(20);
  });
  it('고쳐서 줄어도 이미 받은 경험치는 그대로 (차이만 더 준다)', () => {
    expect(xpDelta(20, 30)).toBe(10);
    expect(xpDelta(30, 20)).toBe(0);
  });
});

describe('레벨 곡선', () => {
  it('30, 50, 70 …', () => {
    expect([1, 2, 3, 4].map(xpToNext)).toEqual([30, 50, 70, 90]);
  });

  it('누적 경험치 → 레벨', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, needed: 30, total: 0 });
    expect(levelFromXp(29).level).toBe(1);
    expect(levelFromXp(30)).toEqual({ level: 2, into: 0, needed: 50, total: 30 });
    expect(levelFromXp(480).level).toBe(7);
    expect(levelFromXp(479).level).toBe(6);
  });

  it('Lv.7은 2~3주: 하루 20이면 24일, 30이면 16일 안쪽', () => {
    const daysTo = (perDay: number) => {
      let d = 0;
      while (levelFromXp(d * perDay).level < 7) d++;
      return d;
    };
    expect(daysTo(25)).toBeGreaterThanOrEqual(14);
    expect(daysTo(25)).toBeLessThanOrEqual(21);
    expect(daysTo(20)).toBeLessThanOrEqual(24);
    expect(daysTo(30)).toBeGreaterThanOrEqual(14);
  });

  it('경험치가 늘면 레벨은 줄지 않는다', () => {
    let prev = 1;
    for (let xp = 0; xp < 5000; xp += 7) {
      const { level } = levelFromXp(xp);
      expect(level).toBeGreaterThanOrEqual(prev);
      prev = level;
    }
  });
});
