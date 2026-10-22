// 쉼터 화면용 뷰 모델 (12c · 12d). 규칙은 src/domain/rest.ts · indices.ts에서 계산한다.

import { useMemo } from 'react';

import { HEALTH_STATUS, LEISURE_STATUS, WORK_STATUS } from '../copy/labels.ko';
import { lastRestLabel, signalLine, signalWork } from '../copy/rest.ko';
import { addDays, daysBetween, type DayKey } from '../domain/day';
import { INDEX_WINDOW_DAYS, leisureBand, leisureIndex, workBand, workIndex } from '../domain/indices';
import {
  grindStreak,
  placeYearAgo,
  restDaysThisWeek,
  restSignal,
  restSuggestions,
  weekStart,
  yearAgo,
  type Place,
} from '../domain/rest';
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
  restLabel: string;
  lastRest: string;
  weekDays: number;
  /** 지침 신호가 켜졌을 때만 */
  signal: { work: string; rest: string; health: string; line: string } | null;
  suggestions: Place[];
  yearAgo: { date: DayKey; place: Place } | null;
};

export function useRestView(
  byDate: Readonly<Record<DayKey, DayRecord>>,
  places: readonly Place[],
  lastLeisure: DayKey | null,
  today: DayKey,
): RestView {
  return useMemo(() => {
    const rest = leisureIndex(byDate, today);
    const work = workIndex(byDate, today);
    const conditionByDay: Record<DayKey, Condition> = Object.fromEntries(Object.values(byDate).map((r) => [r.date, r.condition]));
    const weather = weatherNow(today, conditionByDay);
    const restLabel = rest === null ? '기록 전' : LEISURE_STATUS[leisureBand(rest)];
    const streak = grindStreak(byDate, today);
    const on = restSignal(work, rest, weather);
    const ya = placeYearAgo(places, today);
    return {
      rest,
      restLabel,
      lastRest: lastRestLabel(lastLeisure ? daysBetween(lastLeisure, today) : null),
      weekDays: restDaysThisWeek(byDate, today),
      signal:
        on && weather && work !== null
          ? { work: signalWork(streak, WORK_STATUS[workBand(work)]), rest: restLabel, health: HEALTH_STATUS[weather], line: signalLine(streak, weather, leisureBand(rest ?? 0)) }
          : null,
      suggestions: restSuggestions(places, today),
      yearAgo: ya ? { date: yearAgo(today), place: ya } : null,
    };
  }, [byDate, places, lastLeisure, today]);
}
