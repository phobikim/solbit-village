// 아침 흐름 (솔이 깨우기 → 하루 고르기 → 마을)의 노출 규칙. 순수 TS.

import { isMiddayOrLater, today, type DayKey } from './day';

/**
 * 오늘(04:00 하루 경계 기준) 아직 아침 흐름을 마치지 않았으면 true.
 * lastDoneDayKey: 마지막으로 아침 흐름을 마친 "하루". 한 번도 없으면 null.
 */
export function shouldShowWake(lastDoneDayKey: DayKey | null, now: Date): boolean {
  if (lastDoneDayKey === null) return true;
  return lastDoneDayKey < today(now);
}

/** 솔이 깨우기 방송 문구 구분: 04:00~10:59 'morning', 11:00~ 'midday' */
export function wakePhase(now: Date): 'morning' | 'midday' {
  return isMiddayOrLater(now) ? 'midday' : 'morning';
}

// ── 오늘 하루 고르기 (아침 흐름 2번째 화면) ─────────────────────────────

/** 하루 종류: 일하는 날 · 노는 날. 쉼은 고르는 게 아니다 (쉼은 저녁 기록 · 쉼터에서 다룬다). */
export type DayType = 'work' | 'play';

export const DAY_TYPES: readonly DayType[] = ['work', 'play'];

/**
 * 저장돼 있던 값이나 바깥에서 들어온 값을 하루 종류로 보정한다.
 * 예전 버전의 'rest' 같은 모르는 값은 "아직 안 골랐다"(null)로 취급한다.
 */
export function normalizeDayType(value: unknown): DayType | null {
  return value === 'work' || value === 'play' ? value : null;
}

// TODO(미정, 사용자에게 물을 것 — 이번에는 구현하지 않는다):
//  ① 하루 종류(일 · 놀기)를 저장하는 데이터 모델. 지금은 메모리에만 둔다.
//  ② 월급 · 흥 지급 시점과 모델은 src/domain/rewards.ts 의 TODO 참고.

/** 솔이 포즈 이름. 그림은 src/ui/characters/soliPoses.ts */
export type SoliPoseName = 'base' | 'walkA' | 'walkB' | 'balloonA' | 'balloonB';

/** 하루 종류별 포즈 교대 주기(ms)와 각 포즈가 보이는 시간. 마지막 포즈는 주기가 끝날 때까지. */
export const SOLI_CYCLE = {
  /** 걷기 A ↔ B 약 0.35초씩 (제자리) */
  work: [
    ['walkA', 350],
    ['walkB', 350],
  ],
  /** 풍선 공중 약 0.4초 → 착지 약 0.25초 */
  play: [
    ['balloonA', 400],
    ['balloonB', 250],
  ],
} as const satisfies Record<string, readonly (readonly [SoliPoseName, number])[]>;

const cycleTotal = (day: DayType) => SOLI_CYCLE[day].reduce((sum, [, ms]) => sum + ms, 0);

/**
 * 지금 보일 포즈.
 * elapsedMs: 움직임이 시작된 뒤 흐른 시간. 움직임을 멈췄다면(모션 줄이기 · 포커스 잃음) null — 일은 걷기 A, 놀기는 풍선 공중 포즈로 고정.
 */
export function soliPoseFor(day: DayType | null, elapsedMs: number | null): SoliPoseName {
  if (day === null) return 'base';
  const cycle = SOLI_CYCLE[day];
  if (elapsedMs === null) return cycle[0][0];
  const total = cycleTotal(day);
  let t = ((elapsedMs % total) + total) % total;
  for (const [pose, ms] of cycle) {
    if (t < ms) return pose;
    t -= ms;
  }
  return cycle[0][0];
}

/** 지금 보이는 포즈가 바뀔 때까지 남은 시간(ms). 고른 하루가 없으면 null (바뀌지 않는다). */
export function soliPoseDelay(day: DayType | null, elapsedMs: number): number | null {
  if (day === null) return null;
  const cycle = SOLI_CYCLE[day];
  const total = cycleTotal(day);
  let t = ((elapsedMs % total) + total) % total;
  for (const [, ms] of cycle) {
    if (t < ms) return ms - t;
    t -= ms;
  }
  return cycle[0][1];
}

/** 놀기 때 풍선이 흔들리는 각도(도). 한 번 뜰 때마다(주기마다) 좌우가 번갈아 바뀐다. */
export const BALLOON_TILT_DEG = 5;

export function balloonTilt(elapsedMs: number): number {
  const hop = Math.floor(Math.max(0, elapsedMs) / cycleTotal('play'));
  return hop % 2 === 0 ? -BALLOON_TILT_DEG : BALLOON_TILT_DEG;
}
