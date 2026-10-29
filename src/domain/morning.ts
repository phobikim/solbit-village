// 아침 흐름 (솔이 깨우기 → 컨디션 …)의 노출 규칙. 순수 TS.

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

export type DayType = 'work' | 'rest' | 'play';
export type MorningCondition = 'sunny' | 'partly' | 'cloudy' | 'rain' | 'storm';

export const DAY_TYPES: readonly DayType[] = ['work', 'rest', 'play'];
export const MORNING_CONDITIONS: readonly MorningCondition[] = ['sunny', 'partly', 'cloudy', 'rain', 'storm'];

// TODO(미정, 사용자에게 물을 것 — 이번에는 구현하지 않는다):
//  ① 아침 컨디션과 저녁 기록 컨디션의 관계. 아침은 솔이 표정과 이장 멘트만 쓰고, 날씨 지수는 저녁 기록 기준으로 가자는 안이 있음.
//  ② 하루 종류(일 · 쉼 · 놀기)가 쉼 지수에 반영되는지.
//  ③ 월급 지급과 하루 종류 저장 데이터 모델.

/** 오늘 하루 고르기 화면의 이장 방송: 폭풍이면 개그 없이 짧게 (CLAUDE.md 규칙 7), 아니면 질문 */
export type DayPickBroadcast = 'ask' | 'storm';

export function dayPickBroadcast(condition: MorningCondition | null): DayPickBroadcast {
  return condition === 'storm' ? 'storm' : 'ask';
}

/** 솔이 포즈 이름. 그림은 src/ui/characters/soliPoses.ts */
export type SoliPoseName = 'base' | 'walkA' | 'walkB' | 'rest' | 'jump' | 'land';

/** 하루 종류별 포즈 교대 주기(ms)와 각 포즈가 보이는 시간. 마지막 포즈는 주기가 끝날 때까지. */
export const SOLI_CYCLE = {
  /** 걷기 A ↔ B 약 0.35초씩 */
  work: [
    ['walkA', 350],
    ['walkB', 350],
  ],
  /** 점프 약 0.4초 → 착지 약 0.25초 */
  play: [
    ['jump', 400],
    ['land', 250],
  ],
} as const satisfies Record<string, readonly (readonly [SoliPoseName, number])[]>;

/**
 * 지금 보일 포즈.
 * elapsedMs: 움직임이 시작된 뒤 흐른 시간. 움직임을 멈췄다면(모션 줄이기 · 포커스 잃음) null — 일은 걷기 A, 놀기는 점프로 고정.
 */
export function soliPoseFor(day: DayType | null, elapsedMs: number | null): SoliPoseName {
  if (day === null) return 'base';
  if (day === 'rest') return 'rest';
  const cycle = SOLI_CYCLE[day];
  if (elapsedMs === null) return cycle[0][0];
  const total = cycle.reduce((sum, [, ms]) => sum + ms, 0);
  let t = ((elapsedMs % total) + total) % total;
  for (const [pose, ms] of cycle) {
    if (t < ms) return pose;
    t -= ms;
  }
  return cycle[0][0];
}

/** 지금 보이는 포즈가 바뀔 때까지 남은 시간(ms). 일 · 놀기가 아니면 null (바뀌지 않는다). */
export function soliPoseDelay(day: DayType | null, elapsedMs: number): number | null {
  if (day !== 'work' && day !== 'play') return null;
  const cycle = SOLI_CYCLE[day];
  const total = cycle.reduce((sum, [, ms]) => sum + ms, 0);
  let t = ((elapsedMs % total) + total) % total;
  for (const [, ms] of cycle) {
    if (t < ms) return ms - t;
    t -= ms;
  }
  return cycle[0][1];
}
