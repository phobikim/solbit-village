// 쉼터 화면용 뷰 모델 (쉼 상태 · 가고 싶은 곳 · 다녀온 곳). 규칙은 src/domain/rest.ts · indices.ts에서 계산한다.

import { useMemo } from 'react';

import { HEALTH_STATUS, LEISURE_STATUS, WORK_STATUS } from '../copy/labels.ko';
import { lastRestLabel, signalLine, signalWork } from '../copy/rest.ko';
import { addDays, daysBetween, type DayKey } from '../domain/day';
import { INDEX_WINDOW_DAYS, leisureBand, leisureIndex, workBand, workIndex, type LeisureBand } from '../domain/indices';
import {
  grindStreak,
  lastRestDay,
  placeYearAgo,
  restSignal,
  restSuggestions,
  restWeek,
  tripDays,
  visitCounts,
  visitedList,
  weekStart,
  wishList,
  yearAgo,
  type DurationFilter,
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
  band: LeisureBand | null;
  /** 꽃 상태 (활짝 핌 …) */
  restLabel: string;
  /** 이번 주 월 ~ 일: 쉰 날 */
  week: boolean[];
  lastRest: string;
  wish: Place[];
  visited: Place[];
  /** 다녀온 곳 카드 id → "n번 감" */
  visitCounts: Map<string, number>;
  // 꺼 둔 기능 (src/ui/features.ts)
  signal: { work: string; rest: string; health: string; line: string } | null;
  suggestions: Place[];
  yearAgo: { date: DayKey; place: Place } | null;
};

export function useRestView(
  byDate: Readonly<Record<DayKey, DayRecord>>,
  places: readonly Place[],
  lastLeisure: DayKey | null,
  today: DayKey,
  filter: DurationFilter,
): RestView {
  return useMemo(() => {
    const trips = tripDays(places);
    const rest = leisureIndex(byDate, today, trips);
    const band = rest === null ? null : leisureBand(rest);
    const work = workIndex(byDate, today);
    const conditionByDay: Record<DayKey, Condition> = Object.fromEntries(Object.values(byDate).map((r) => [r.date, r.condition]));
    const weather = weatherNow(today, conditionByDay);
    const restLabel = band === null ? '기록 전' : LEISURE_STATUS[band];
    const last = lastRestDay(lastLeisure, trips, today);
    const streak = grindStreak(byDate, today);
    const ya = placeYearAgo(places, today);
    return {
      rest,
      band,
      restLabel,
      week: restWeek(byDate, trips, today),
      lastRest: lastRestLabel(last ? daysBetween(last, today) : null),
      wish: wishList(places, filter, band),
      visited: visitedList(places),
      visitCounts: visitCounts(places),
      signal:
        restSignal(work, rest, weather) && weather && work !== null && band
          ? { work: signalWork(streak, WORK_STATUS[workBand(work)]), rest: restLabel, health: HEALTH_STATUS[weather], line: signalLine(streak, weather, band) }
          : null,
      suggestions: restSuggestions(places, today),
      yearAgo: ya ? { date: yearAgo(today), place: ya } : null,
    };
  }, [byDate, places, lastLeisure, today, filter]);
}
