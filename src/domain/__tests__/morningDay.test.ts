import { dayPickBroadcast, soliPoseDelay, soliPoseFor } from '../morning';

describe('dayPickBroadcast', () => {
  it('폭풍이면 짧은 방송', () => {
    expect(dayPickBroadcast('storm')).toBe('storm');
  });
  it('폭풍이 아니거나 선택 전이면 질문', () => {
    expect(dayPickBroadcast(null)).toBe('ask');
    expect(dayPickBroadcast('sunny')).toBe('ask');
    expect(dayPickBroadcast('rain')).toBe('ask');
  });
});

describe('soliPoseFor', () => {
  it('선택 전은 기본', () => {
    expect(soliPoseFor(null, 0)).toBe('base');
    expect(soliPoseFor(null, null)).toBe('base');
  });
  it('쉼은 늘 쉼 포즈', () => {
    expect(soliPoseFor('rest', 0)).toBe('rest');
    expect(soliPoseFor('rest', 1234)).toBe('rest');
    expect(soliPoseFor('rest', null)).toBe('rest');
  });
  it('일은 0.35초마다 걷기 A ↔ B', () => {
    expect(soliPoseFor('work', 0)).toBe('walkA');
    expect(soliPoseFor('work', 349)).toBe('walkA');
    expect(soliPoseFor('work', 350)).toBe('walkB');
    expect(soliPoseFor('work', 699)).toBe('walkB');
    expect(soliPoseFor('work', 700)).toBe('walkA');
  });
  it('놀기는 점프 0.4초 → 착지 0.25초', () => {
    expect(soliPoseFor('play', 0)).toBe('jump');
    expect(soliPoseFor('play', 399)).toBe('jump');
    expect(soliPoseFor('play', 400)).toBe('land');
    expect(soliPoseFor('play', 649)).toBe('land');
    expect(soliPoseFor('play', 650)).toBe('jump');
  });
  it('움직임을 멈추면 일은 걷기 A, 놀기는 점프로 고정', () => {
    expect(soliPoseFor('work', null)).toBe('walkA');
    expect(soliPoseFor('play', null)).toBe('jump');
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
  it('일 · 놀기가 아니면 바뀌지 않는다', () => {
    expect(soliPoseDelay(null, 0)).toBeNull();
    expect(soliPoseDelay('rest', 500)).toBeNull();
  });
});
