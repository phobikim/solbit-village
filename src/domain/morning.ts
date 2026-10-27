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
