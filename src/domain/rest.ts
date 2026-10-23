// 쉼터 — SPEC 15장. 2026-10-23 정리: 다녀온 곳 / 가고 싶은 곳 / 쉼 지수 세 가지.
// 쉼 지수 = 여가 지수. 다녀온 곳의 날짜 범위(출발일 ~ 출발일 + n박)도 쉰 날로 센다 (같은 날 기록의 쉼과 겹치면 한 번).
// 다녀온 곳은 기록이 아니어서 이미 심은 작물 · 경험치는 바뀌지 않는다 (규칙 3).
// 지침 신호 · 오늘의 쉼 제안 · 1년 전 오늘 · 날짜 잡기는 코드만 두고 화면에서는 끈다 (src/ui/features.ts).

import { addDays, daysBetween, parseDayKey, weekdayOf, type DayKey } from './day';
import type { VillageEvent } from './events';
import { LEISURE_LOW, WORK_OVERHEAT, type LeisureBand } from './indices';
import type { DayRecord, Weather } from './types';

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
  /** 가고 싶은 곳: 메모 (선택) */
  memo: string | null;
  /** 다녀온 곳: 한 줄 소감 (선택) */
  note: string | null;
  /** '날짜 잡기'로 만든 여행 행사 (지금은 꺼 둔 기능) */
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
export const PLACE_TEXT_MAX = 40;
export const PLACE_NIGHTS_MAX = 14;

// ── 쉰 날 (기록의 쉼 + 다녀온 곳) ──────────────────────────────────────

/** 다녀온 곳이 차지하는 날 (출발일 ~ 출발일 + n박). 여러 곳이 겹쳐도 한 번씩. */
export function tripDays(places: readonly Place[]): Set<DayKey> {
  const out = new Set<DayKey>();
  for (const p of places) {
    if (!p.visited || !p.visitedDate) continue;
    for (let i = 0; i <= p.nights; i++) out.add(addDays(p.visitedDate, i));
  }
  return out;
}

/** 쉰 날인가: 그날 기록에 쉼이 있거나, 다녀온 곳 날짜 안이거나 */
export function isRestDay(day: DayKey, records: Readonly<Record<DayKey, DayRecord>>, trips: ReadonlySet<DayKey>): boolean {
  return !!records[day]?.leisure.length || trips.has(day);
}

/** 이번 주 첫날 (월요일) — 기록을 불러올 범위 */
export function weekStart(today: DayKey): DayKey {
  return addDays(today, -((weekdayOf(today) + 6) % 7));
}

/** 이번 주 월 ~ 일 7칸: 쉰 날이면 true (아직 안 온 날은 false) */
export function restWeek(records: Readonly<Record<DayKey, DayRecord>>, trips: ReadonlySet<DayKey>, today: DayKey): boolean[] {
  const mon = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(mon, i);
    return daysBetween(d, today) >= 0 && isRestDay(d, records, trips);
  });
}

/** 이번 주(월요일부터 오늘까지) 쉰 날 수 */
export function restDaysThisWeek(records: Readonly<Record<DayKey, DayRecord>>, today: DayKey, trips: ReadonlySet<DayKey> = new Set()): number {
  return restWeek(records, trips, today).filter(Boolean).length;
}

/**
 * 마지막으로 쉰 날 (오늘 포함, 미래 제외). 없으면 null.
 * lastLeisure: 기록에서 쉼을 적은 가장 최근 날 (불러온 범위 밖까지 data에서 찾아 넘긴다).
 */
export function lastRestDay(lastLeisure: DayKey | null, trips: ReadonlySet<DayKey>, today: DayKey): DayKey | null {
  let best = lastLeisure && daysBetween(lastLeisure, today) >= 0 ? lastLeisure : null;
  for (const d of trips) if (daysBetween(d, today) >= 0 && (!best || d > best)) best = d;
  return best;
}

// ── 가고 싶은 곳 ───────────────────────────────────────────────────────

export type DurationFilter = 'all' | PlaceDuration;

/** 쉼 상태가 이 이하이면 30분 항목을 맨 위로 (봉오리 · 잎만 남음) */
export const SHORT_FIRST_BANDS: readonly LeisureBand[] = ['bud', 'none'];

/** 가고 싶은 곳: 걸리는 시간으로 거르고, 오래 담아둔 순. 쉼이 봉오리 이하이면 30분이 맨 위. */
export function wishList(places: readonly Place[], filter: DurationFilter, band: LeisureBand | null): Place[] {
  const shortFirst = band !== null && SHORT_FIRST_BANDS.includes(band);
  return places
    .filter((p) => !p.visited && (filter === 'all' || p.duration === filter))
    .sort((a, b) => (shortFirst ? Number(b.duration === 'short') - Number(a.duration === 'short') : 0) || a.createdAt - b.createdAt);
}

/** [다녀왔슈]: 가고 싶은 곳 → 다녀온 곳 (메모는 그대로 둔다) */
export function markVisited(p: Place, visitedDate: DayKey, nights: number, note: string | null): Place {
  return { ...p, visited: true, visitedDate, nights: clampNights(nights), note: note?.trim() || null, eventId: null };
}

// ── 다녀온 곳 ──────────────────────────────────────────────────────────

/** 다녀온 곳: 최근에 다녀온 순 */
export function visitedList(places: readonly Place[]): Place[] {
  return places
    .filter((p) => p.visited)
    .sort((a, b) => (b.visitedDate ?? '').localeCompare(a.visitedDate ?? '') || b.createdAt - a.createdAt);
}

/** 같은 장소로 보는 이름 (앞뒤 · 가운데 띄어쓰기 무시) */
const placeKey = (name: string) => name.replace(/\s+/g, '');

/**
 * 같은 장소를 몇 번 다녀왔나 → 그 장소의 가장 최근 다녀온 곳 카드에만 "n번 감" (2번부터).
 * 결과: 카드 id → 다녀온 횟수
 */
export function visitCounts(places: readonly Place[]): Map<string, number> {
  const groups = new Map<string, Place[]>();
  for (const p of visitedList(places)) {
    const k = placeKey(p.name);
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  const out = new Map<string, number>();
  for (const list of groups.values()) if (list.length > 1) out.set(list[0].id, list.length);
  return out;
}

/** [또 가고 싶슈]: 다녀온 곳을 가고 싶은 곳에 복사. 같은 이름이 이미 가고 싶은 곳에 있으면 null. */
export function wishAgain(p: Place, places: readonly Place[], id: string, today: DayKey, now: number): Place | null {
  if (places.some((x) => !x.visited && placeKey(x.name) === placeKey(p.name))) return null;
  return {
    id,
    name: p.name,
    duration: p.duration,
    visited: false,
    memo: p.memo,
    note: null,
    eventId: null,
    visitedDate: null,
    nights: 0,
    addedDate: today,
    createdAt: now,
  };
}

export const clampNights = (n: number) => Math.max(0, Math.min(PLACE_NIGHTS_MAX, Math.floor(n)));

/** 담아둔 지 얼마나 됐나 (일 수) */
export function keptDays(p: Place, today: DayKey): number {
  return Math.max(0, daysBetween(p.addedDate, today));
}

// ── 꺼 둔 기능 (코드만 둔다) ────────────────────────────────────────────

/** 지침 신호가 켜지는 날씨(건강): 흐림보다 나쁘면 */
export const REST_SIGNAL_WEATHER: readonly Weather[] = ['over', 'rain', 'storm'];

/** 지침 신호 — 일 지수 80 이상 + 쉼 지수 20 이하 + 건강 날씨 흐림 이하 (2026-10-22 사용자 결정) */
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

/**
 * 오늘의 쉼 제안: 가고 싶은 곳에서 걸리는 시간마다 하나씩 (날짜가 이미 잡힌 곳은 뺀다).
 * 같은 날에는 같은 제안, 날이 바뀌면 차례로 돌아간다 (확률 없음).
 */
export function restSuggestions(places: readonly Place[], today: DayKey): Place[] {
  const dayNo = daysBetween('2000-01-01', today);
  const out: Place[] = [];
  for (const d of PLACE_DURATIONS) {
    const pool = places.filter((p) => !p.visited && !p.eventId && p.duration === d).sort((a, b) => a.createdAt - b.createdAt);
    if (pool.length) out.push(pool[dayNo % pool.length]);
  }
  return out;
}

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
