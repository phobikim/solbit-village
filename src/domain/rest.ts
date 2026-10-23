// 쉼터 — 보따리(가고 싶은 곳 = 깃발 · 다녀온 곳 = 발자국). 쉼 지수(모닥불)는 fire.ts.
// 다녀온 곳의 날짜 범위(출발일 ~ 출발일 + n박)는 머문 날마다 통나무로 센다 (장작 기록에서 찍은 발자국은 제외 — 그날은 장작 기록이 센다).
// 다녀온 곳은 기록이 아니어서 이미 심은 작물 · 경험치는 바뀌지 않는다 (규칙 3).
// 지침 신호 · 1년 전 오늘은 코드만 두고 화면에서는 끈다 (src/ui/features.ts).

import { addDays, daysBetween, parseDayKey, weekdayOf, type DayKey } from './day';
import type { VillageEvent } from './events';
import { LEISURE_LOW, WORK_OVERHEAT } from './indices';
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
  /** 장작 던지기에서 '발자국 찍어둘게유'로 만든 곳 — 그 쉼 기록 id (머문 날을 통나무로 세지 않는다) */
  logId: string | null;
  /** 다녀온 곳: 출발한 날 */
  visitedDate: DayKey | null;
  /** 다녀온 곳: 몇 박 (0 = 당일치기). 날짜 잡은 깃발은 계획한 박 수 */
  nights: number;
  /** 보따리에 담은 날 */
  addedDate: DayKey;
  createdAt: number;
};

export const PLACE_NAME_MAX = 20;
export const PLACE_TEXT_MAX = 40;
export const PLACE_NIGHTS_MAX = 14;

// ── 다녀온 날 (쉼 지수에서 통나무로 센다) ───────────────────────────────

/** 다녀온 곳이 차지하는 날 (출발일 ~ 출발일 + n박). 여러 곳이 겹쳐도 한 번씩. 장작에서 찍은 발자국은 뺀다. */
export function tripDays(places: readonly Place[]): Set<DayKey> {
  const out = new Set<DayKey>();
  for (const p of places) {
    if (!p.visited || !p.visitedDate || p.logId) continue;
    for (let i = 0; i <= p.nights; i++) out.add(addDays(p.visitedDate, i));
  }
  return out;
}

/** 이번 주 첫날 (월요일) */
export function weekStart(today: DayKey): DayKey {
  return addDays(today, -((weekdayOf(today) + 6) % 7));
}

// ── 가고 싶은 곳 ───────────────────────────────────────────────────────

/** 가고 싶은 곳(깃발): 오래 담아둔 순 */
export function wishList(places: readonly Place[]): Place[] {
  return places.filter((p) => !p.visited).sort((a, b) => a.createdAt - b.createdAt);
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
    logId: null,
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

// ── 깃발 → 발자국 ───────────────────────────────────────────────────────

/** 오래된 깃발 말풍선이 뜨는 기준 (깃발 꽂은 지 며칠) */
// TODO(사용자 확인): 디자인은 "석 달"만 보여준다. '오래된'의 기준을 정해 주세요.
export const FLAG_OLD_DAYS = 60;

/**
 * 날짜 잡은 깃발은 행사 날이 지나면(마지막 날 다음 날부터) 발자국으로 옮긴다.
 * 출발일 ~ 박 수가 다녀온 곳 날짜가 되어 머문 날마다 통나무로 센다.
 * 행사를 지워서 날짜가 사라진 깃발은 평범한 깃발로 돌린다. 바뀐 곳만 돌려준다.
 */
export function settleTrips(places: readonly Place[], events: readonly VillageEvent[], today: DayKey): Place[] {
  const out: Place[] = [];
  for (const p of places) {
    if (p.visited || !p.eventId) continue;
    const e = events.find((x) => x.id === p.eventId);
    if (!e) {
      out.push({ ...p, eventId: null, nights: 0 });
      continue;
    }
    if (e.repeatYearly) continue;
    if (daysBetween(addDays(e.date, p.nights), today) > 0) out.push(markVisited(p, e.date, p.nights, null));
  }
  return out;
}

/** 장소 이름이 같은지 (띄어쓰기 무시) */
export const samePlace = (a: string, b: string) => placeKey(a) === placeKey(b);

/**
 * 장작 던지기의 장소 태그 → 지도에 발자국. 가고 싶은 곳(깃발)에 같은 이름이 있으면 그 깃발이 발자국이 되고,
 * 없으면 새 발자국을 만든다. 장작 기록에서 찍은 발자국이라 logId를 단다.
 */
export function footprintFor(
  name: string,
  date: DayKey,
  logId: string,
  places: readonly Place[],
  newId: string,
  now: number,
): Place {
  const flag = places.find((p) => !p.visited && samePlace(p.name, name));
  if (flag) return { ...markVisited(flag, date, 0, null), logId };
  return {
    id: newId,
    name: name.trim().slice(0, PLACE_NAME_MAX),
    duration: 'half',
    visited: true,
    memo: null,
    note: null,
    eventId: null,
    logId,
    visitedDate: date,
    nights: 0,
    addedDate: date,
    createdAt: now,
  };
}
