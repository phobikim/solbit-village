// 쉼터 화면용 뷰 모델 (모닥불 · 쪽지 · 보따리). 규칙은 src/domain/fire.ts · rest.ts · restNote.ts에서 계산한다.

import { useMemo } from 'react';

import { HEALTH_STATUS, LEISURE_STATUS, WORK_STATUS } from '../copy/labels.ko';
import { signalLine, signalWork } from '../copy/rest.ko';
import { addDays, type DayKey } from '../domain/day';
import { daysSinceFire, fireBand, fireIndex, weekLogs, type FireBand } from '../domain/fire';
import { INDEX_WINDOW_DAYS, workBand, workIndex } from '../domain/indices';
import {
  grindStreak,
  placeYearAgo,
  restSignal,
  tripDays,
  visitedList,
  weekStart,
  wishList,
  yearAgo,
  type Place,
} from '../domain/rest';
import type { RestLog } from '../domain/fire';
import type { Condition, DayRecord } from '../domain/types';
import { WEATHER_WINDOW_DAYS, weatherNow } from '../domain/weather';

/** 쉼터가 읽어야 하는 기록 범위 (지수 7일 · 날씨 · 이번 주) */
export function restRange(today: DayKey): { from: DayKey; to: DayKey } {
  const lookback = addDays(today, -Math.max(INDEX_WINDOW_DAYS + WEATHER_WINDOW_DAYS, 7));
  const week = weekStart(today);
  return { from: week < lookback ? week : lookback, to: today };
}

export type RestView = {
  rest: number | null;
  band: FireBand | null;
  /** 불 상태 이름 (활활 …) */
  bandLabel: string;
  /** 이번 주(월 ~ 일) 쉼 기록: 최신이 위 */
  weekLogs: RestLog[];
  /** 장작 안 들어온 지 n일 (한 번도 없으면 null) */
  sinceFire: number | null;
  wish: Place[];
  /** 다녀온 곳: 최근에 다녀온 순 */
  visited: Place[];
  // 꺼 둔 기능 (src/ui/features.ts)
  signal: { work: string; rest: string; health: string; line: string } | null;
  yearAgo: { date: DayKey; place: Place } | null;
};

export function useRestView(
  byDate: Readonly<Record<DayKey, DayRecord>>,
  places: readonly Place[],
  logs: readonly RestLog[],
  today: DayKey,
): RestView {
  return useMemo(() => {
    const rest = { logs, trips: tripDays(places) };
    const value = fireIndex(rest, today, (d) => !!byDate[d]);
    const band = value === null ? null : fireBand(value);
    const bandLabel = band === null ? '기록 전' : LEISURE_STATUS[band];
    const work = workIndex(byDate, today);
    const conditionByDay: Record<DayKey, Condition> = Object.fromEntries(Object.values(byDate).map((r) => [r.date, r.condition]));
    const weather = weatherNow(today, conditionByDay);
    const streak = grindStreak(byDate, today);
    const ya = placeYearAgo(places, today);
    return {
      rest: value,
      band,
      bandLabel,
      weekLogs: weekLogs(logs, weekStart(today)),
      sinceFire: daysSinceFire(rest, today),
      wish: wishList(places),
      visited: visitedList(places),
      signal:
        restSignal(work, value, weather) && weather && work !== null && band
          ? { work: signalWork(streak, WORK_STATUS[workBand(work)]), rest: bandLabel, health: HEALTH_STATUS[weather], line: signalLine(streak, weather, band) }
          : null,
      yearAgo: ya ? { date: yearAgo(today), place: ya } : null,
    };
  }, [byDate, places, logs, today]);
}
