import { balloonTilt, DAY_TYPES, normalizeDayType, soliPoseDelay, soliPoseFor } from '../morning';

describe('하루 종류', () => {
  it('일 · 놀기 두 개뿐 (쉼은 고르지 않는다)', () => {
    expect([...DAY_TYPES]).toEqual(['work', 'play']);
  });

  it('예전 값(rest)이나 모르는 값은 "안 골랐다"로 보정', () => {
    expect(normalizeDayType('work')).toBe('work');
    expect(normalizeDayType('play')).toBe('play');
    expect(normalizeDayType('rest')).toBeNull();
    expect(normalizeDayType('')).toBeNull();
    expect(normalizeDayType(undefined)).toBeNull();
    expect(normalizeDayType(3)).toBeNull();
  });
});

describe('soliPoseFor', () => {
  it('선택 전은 기본', () => {
    expect(soliPoseFor(null, 0)).toBe('base');
    expect(soliPoseFor(null, null)).toBe('base');
  });
  it('일은 0.35초마다 걷기 A ↔ B', () => {
    expect(soliPoseFor('work', 0)).toBe('walkA');
    expect(soliPoseFor('work', 349)).toBe('walkA');
    expect(soliPoseFor('work', 350)).toBe('walkB');
    expect(soliPoseFor('work', 699)).toBe('walkB');
    expect(soliPoseFor('work', 700)).toBe('walkA');
  });
  it('놀기는 풍선 공중 0.4초 → 착지 0.25초', () => {
    expect(soliPoseFor('play', 0)).toBe('balloonA');
    expect(soliPoseFor('play', 399)).toBe('balloonA');
    expect(soliPoseFor('play', 400)).toBe('balloonB');
    expect(soliPoseFor('play', 649)).toBe('balloonB');
    expect(soliPoseFor('play', 650)).toBe('balloonA');
  });
  it('움직임을 멈추면 일은 걷기 A, 놀기는 풍선 공중 포즈로 고정', () => {
    expect(soliPoseFor('work', null)).toBe('walkA');
    expect(soliPoseFor('play', null)).toBe('balloonA');
  });
});

describe('soliPoseDelay', () => {
  it('다음 포즈로 바뀔 때까지 남은 시간', () => {
    expect(soliPoseDelay('work', 0)).toBe(350);
    expect(soliPoseDelay('work', 100)).toBe(250);
    expect(soliPoseDelay('work', 350)).toBe(350);
    expect(soliPoseDelay('play', 0)).toBe(400);
    expect(soliPoseDelay('play', 400)).toBe(250);
    expect(soliPoseDelay('play', 650)).toBe(400);
  });
  it('고른 하루가 없으면 바뀌지 않는다', () => {
    expect(soliPoseDelay(null, 0)).toBeNull();
    expect(soliPoseDelay(null, 500)).toBeNull();
  });
});

describe('balloonTilt', () => {
  it('한 번 뜰 때마다(0.65초) 좌우가 번갈아 ±5도', () => {
    expect(balloonTilt(0)).toBe(-5);
    expect(balloonTilt(649)).toBe(-5);
    expect(balloonTilt(650)).toBe(5);
    expect(balloonTilt(1299)).toBe(5);
    expect(balloonTilt(1300)).toBe(-5);
  });
  it('음수 시간은 처음으로 본다', () => {
    expect(balloonTilt(-10)).toBe(-5);
  });
});
