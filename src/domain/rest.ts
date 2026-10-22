// 쉼터 (디자인 v6 TURN 12, 12c · 12d) — SPEC 7장 [확정 2026-10-22].
// 쉼 지수 = 여가 지수 (이름만 쉼). 지침 신호 · 마지막 쉼 · 이번 주 쉰 날 · 쉼 제안 · 보따리 · 1년 전 오늘.
// 벌이 없다 (규칙 4): 지침 신호는 경고가 아니라 이장이 쉬라고 권하는 카드다.

import { addDays, daysBetween, parseDayKey, weekdayOf, type DayKey } from './day';
import type { VillageEvent } from './events';
import { LEISURE_LOW, WORK_OVERHEAT } from './indices';
import type { DayRecord, Weather } from './types';

// ── 지침 신호 ───────────────────────────────────────────────────────────

/** 지침 신호가 켜지는 날씨(건강): 흐림보다 나쁘면 */
export const REST_SIGNAL_WEATHER: readonly Weather[] = ['over', 'rain', 'storm'];

/**
 * 지침 신호 — 2026-10-22 사용자 결정: 일 · 쉼 · 건강 셋 다.
 * 일 지수 80 이상(일 과열) + 쉼 지수 20 이하(쉼 부족) + 건강 날씨 흐림 이하.
 */
export function restSignal(work: number | null, rest: number | null, weather: Weather | null): boolean {
  return (
    work !== null && work >= WORK_OVERHEAT && rest !== null && rest <= LEISURE_LOW && weather !== null && REST_SIGNAL_WEATHER.includes(weather)
  );
}

/** 가장 최근 기록부터 일 강도 3(갈려나감)이 며칠 이어졌는지 (기록 없는 날에서 끊긴다) */
export function grindStreak(records: Readonly<Record<DayKey, DayRecord>>, today: DayKey): number {
  let day = today;
  if (!records[day]) day = addDays(day, -1); // 오늘 아직 안 적었으면 어제부터
  let n = 0;
  while (records[day]?.work === 3) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

// ── 마지막 쉼 · 이번 주 쉰 날 ───────────────────────────────────────────

/** 쉼(여가)을 적은 가장 최근 날 (오늘 포함, 미래 제외). 없으면 null */
export function lastRestDay(records: Readonly<Record<DayKey, DayRecord>>, today: DayKey): DayKey | null {
  let best: DayKey | null = null;
  for (const r of Object.values(records)) {
    if (!r.leisure.length || daysBetween(r.date, today) < 0) continue;
    if (!best || r.date > best) best = r.date;
  }
  return best;
}

/** 이번 주(월요일 시작)에 쉼을 적은 날 수 */
export function restDaysThisWeek(records: Readonly<Record<DayKey, DayRecord>>, today: DayKey): number {
  let n = 0;
  for (let d = weekStart(today); daysBetween(d, today) >= 0; d = addDays(d, 1)) if (records[d]?.leisure.length) n++;
  return n;
}

/** 이번 주 첫날 (월요일) — 기록을 불러올 범위 */
export function weekStart(today: DayKey): DayKey {
  return addDays(today, -((weekdayOf(today) + 6) % 7));
}

// ── 보따리 (가고 싶은 곳 · 다녀온 곳) ───────────────────────────────────

/** 걸리는 시간: 30분 / 반나절 / 주말 */
export type PlaceDuration = 'short' | 'half' | 'weekend';
export const PLACE_DURATIONS: readonly PlaceDuration[] = ['short', 'half', 'weekend'];

export type Place = {
  id: string;
  name: string;
  duration: PlaceDuration;
  /** 가고 싶은 곳 / 다녀온 곳 */
  visited: boolean;
  /** '날짜 잡기'로 만든 여행 행사 */
  eventId: string | null;
  /** 다녀온 곳: 출발한 날 */
  visitedDate: DayKey | null;
  /** 다녀온 곳: 몇 박 (0 = 당일치기) */
  nights: number;
  /** 보따리에 담은 날 */
  addedDate: DayKey;
  createdAt: number;
};

export const PLACE_NAME_MAX = 20;
export const PLACE_NIGHTS_MAX = 14;

/** 가고 싶은 곳은 오래 담아둔 순, 다녀온 곳은 최근에 다녀온 순 */
export function sortPlaces(places: readonly Place[], visited: boolean): Place[] {
  return places
    .filter((p) => p.visited === visited)
    .sort((a, b) =>
      visited ? (b.visitedDate ?? '').localeCompare(a.visitedDate ?? '') || b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    );
}

/** 담아둔 지 얼마나 됐나 (일 수) */
export function keptDays(p: Place, today: DayKey): number {
  return Math.max(0, daysBetween(p.addedDate, today));
}

// ── 1년 전 오늘 ─────────────────────────────────────────────────────────

/** 1년 전 오늘 (2월 29일 → 2월 28일) */
export function yearAgo(today: DayKey): DayKey {
  const { year, month, day } = parseDayKey(today);
  const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const d = month === 2 && day === 29 && !leap(year - 1) ? 28 : day;
  return `${year - 1}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 1년 전 오늘 다녀오던 곳 (출발일 ~ 출발일 + 박 수). 없으면 null */
export function placeYearAgo(places: readonly Place[], today: DayKey): Place | null {
  const then = yearAgo(today);
  return (
    places.find((p) => p.visited && p.visitedDate && daysBetween(p.visitedDate, then) >= 0 && daysBetween(p.visitedDate, then) <= p.nights) ??
    null
  );
}

/** '날짜 잡기'로 잡힌 여행 날짜 — 행사가 남아 있고 아직 안 지났을 때만 */
export function scheduledDate(p: Place, events: readonly VillageEvent[], today: DayKey): DayKey | null {
  const e = p.eventId ? events.find((x) => x.id === p.eventId) : undefined;
  return e && daysBetween(today, e.date) >= 0 ? e.date : null;
}
