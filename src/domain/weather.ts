// 컨디션 → 날씨 5단계 (SPEC 3장).
// TODO: SPEC 3장 [미정] — 아래 값은 SPEC의 [제안] 그대로다. 2주 써보기(단계 7) 후 사용자와 조정.

import { addDays, type DayKey } from './day';
import type { Condition, Weather } from './types';

/** 최근 며칠의 컨디션을 볼지 */
export const WEATHER_WINDOW_DAYS = 3;

/** 평균 점수(지침 1, 보통 2, 신남 3) 하한 → 날씨. 위에서부터 검사. */
export const WEATHER_THRESHOLDS: readonly { min: number; weather: Weather }[] = [
  { min: 2.6, weather: 'sun' },
  { min: 2.2, weather: 'cloud' },
  { min: 1.8, weather: 'over' },
  { min: 1.4, weather: 'rain' },
];

export function weatherFromScore(avg: number): Weather {
  return WEATHER_THRESHOLDS.find((t) => avg >= t.min)?.weather ?? 'storm';
}

/**
 * 그날의 날씨. 그날 포함 최근 3일 중 기록이 있는 날의 컨디션 평균.
 * 그날 기록이 없으면 null (달력에 아이콘 없음).
 */
export function weatherOn(day: DayKey, conditionByDay: Readonly<Record<DayKey, Condition>>): Weather | null {
  if (conditionByDay[day] === undefined) return null;
  const scores: number[] = [];
  for (let i = 0; i < WEATHER_WINDOW_DAYS; i++) {
    const c = conditionByDay[addDays(day, -i)];
    if (c !== undefined) scores.push(c);
  }
  return weatherFromScore(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function isRainy(w: Weather | null): boolean {
  return w === 'rain' || w === 'storm';
}
