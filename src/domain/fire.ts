// 쉼 지수 = 모닥불 (디자인 v8 TURN 15, 2026-10-23). 쉼 기록(장작)을 던질 때마다 불이 붙는다.
// 최근 7일 장작 점수 합 (잔가지 10 / 장작 20 / 통나무 35, 하루 최대 35, 상한 100).
// 다녀온 곳은 머문 날마다 통나무로 센다. 이 파일은 Place를 모른다 — 다녀온 날 집합은 rest.ts tripDays가 만들어 넘긴다.

import { addDays, daysBetween, type DayKey } from './day';
import type { Contact } from './types';

/** 장작 크기: 잔가지(한두 시간) / 장작(반나절) / 통나무(하루 꼬박) */
export type RestSize = 'twig' | 'firewood' | 'log';
export const REST_SIZES: readonly RestSize[] = ['twig', 'firewood', 'log'];
export const DEFAULT_REST_SIZE: RestSize = 'firewood';

export const SIZE_SCORE: Record<RestSize, number> = { twig: 10, firewood: 20, log: 35 };
/** 하루에 쌓이는 점수 상한 (통나무 하나 = 하루 꼬박) */
export const DAY_SCORE_MAX = 35;
/** 쉼 지수 상한 */
export const FIRE_MAX = 100;
/** 최근 며칠을 볼지 */
export const FIRE_WINDOW_DAYS = 7;

/** 태그 종류: 활동 · 이웃 · 장소 · 기타 (디자인 15b) */
export type RestTagKind = 'activity' | 'neighbor' | 'place' | 'etc';
export type RestTag = {
  kind: RestTagKind;
  label: string;
  /** 이웃: 이웃 id */
  ref?: string;
};

export type RestLog = {
  id: string;
  date: DayKey;
  /** 말하듯 적은 한 줄 (기록 시트에서 온 쉼은 빈 문자열일 수 있다) */
  text: string;
  tags: RestTag[];
  size: RestSize;
  createdAt: number;
};

/** 다녀온 곳에서 온 장작 표시 (지도 [다녀왔슈] → 장작 던지기 시트가 채워 준다) */
export const VISITED_TAG_LABEL = '다녀옴';
export const visitedTag = (): RestTag => ({ kind: 'etc', label: VISITED_TAG_LABEL });
export const isVisitLog = (l: RestLog): boolean => l.tags.some((t) => t.kind === 'etc' && t.label === VISITED_TAG_LABEL);

export const REST_TEXT_MAX = 60;
export const REST_TAGS_MAX = 8;
export const REST_TAG_LABEL_MAX = 12;

/** 쉼 지수 입력: 쉼 기록 + 다녀온 곳의 날짜 */
export type RestSource = { logs: readonly RestLog[]; trips: ReadonlySet<DayKey> };
export const NO_REST: RestSource = { logs: [], trips: new Set() };

/** 날짜 → 그날 쉼 기록 */
export function logsByDay(logs: readonly RestLog[]): Map<DayKey, RestLog[]> {
  const out = new Map<DayKey, RestLog[]>();
  for (const l of logs) {
    const list = out.get(l.date);
    if (list) list.push(l);
    else out.set(l.date, [l]);
  }
  return out;
}

/** 이번 주(월 ~ 일) 쉼 기록: 최신이 위 */
export function weekLogs(logs: readonly RestLog[], mon: DayKey): RestLog[] {
  const sun = addDays(mon, 6);
  return logs
    .filter((l) => l.date >= mon && l.date <= sun)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt || b.id.localeCompare(a.id));
}

/** 하루 점수: 그날 장작 점수 합 (최대 35). 다녀온 날은 통나무 = 35. */
export function dayScore(logs: readonly RestLog[], isTrip: boolean): number {
  if (isTrip) return DAY_SCORE_MAX;
  return Math.min(DAY_SCORE_MAX, logs.reduce((a, l) => a + SIZE_SCORE[l.size], 0));
}

/** 쉼이 들어온 날 (장작을 던졌거나 다녀온 곳) */
export function fireDays(src: RestSource): Set<DayKey> {
  const out = new Set<DayKey>(src.trips);
  for (const l of src.logs) out.add(l.date);
  return out;
}

/**
 * 쉼 지수: 최근 7일 장작 점수 합 (상한 100).
 * 기록한 날(hasRecord)도 쉼도 없으면 null (아직 불을 못 본 상태).
 */
export function fireIndex(src: RestSource, end: DayKey, hasRecord: (d: DayKey) => boolean): number | null {
  const byDay = logsByDay(src.logs);
  let seen = false;
  let sum = 0;
  for (let i = 0; i < FIRE_WINDOW_DAYS; i++) {
    const d = addDays(end, -i);
    const logs = byDay.get(d) ?? [];
    const trip = src.trips.has(d);
    if (hasRecord(d) || logs.length || trip) seen = true;
    sum += dayScore(logs, trip);
  }
  return seen ? Math.min(FIRE_MAX, sum) : null;
}

/** 불 상태: 활활(70+) / 타오름(40+) / 사그라듦(20+) / 꺼져감 */
export type FireBand = 'blaze' | 'burning' | 'dying' | 'out';
export function fireBand(v: number): FireBand {
  return v >= 70 ? 'blaze' : v >= 40 ? 'burning' : v >= 20 ? 'dying' : 'out';
}

/** 쪽지 제안이 나오는 불 상태: 사그라듦 이하 */
export const NOTE_BANDS: readonly FireBand[] = ['dying', 'out'];

/** 마지막으로 장작이 들어온 날 (오늘 포함, 미래 제외) */
export function lastFireDay(src: RestSource, today: DayKey): DayKey | null {
  let best: DayKey | null = null;
  for (const d of fireDays(src)) if (daysBetween(d, today) >= 0 && (!best || d > best)) best = d;
  return best;
}

/** 장작 안 들어온 지 n일 (오늘 들어왔으면 0, 한 번도 없으면 null) */
export function daysSinceFire(src: RestSource, today: DayKey): number | null {
  const last = lastFireDay(src, today);
  return last === null ? null : daysBetween(last, today);
}

/** 이웃 태그 → 그날 '만남' 연락 (태그를 빼면 같이 빠진다). 이웃 한 명은 하루 한 번. */
export function logContacts(logs: readonly RestLog[], knownNeighbor?: (id: string) => boolean): Map<DayKey, Contact[]> {
  const out = new Map<DayKey, Contact[]>();
  for (const l of logs) {
    for (const t of l.tags) {
      if (t.kind !== 'neighbor' || !t.ref) continue;
      if (knownNeighbor && !knownNeighbor(t.ref)) continue;
      const list = out.get(l.date) ?? [];
      if (!list.some((c) => c.neighborId === t.ref)) list.push({ neighborId: t.ref, method: 'meet' });
      out.set(l.date, list);
    }
  }
  return out;
}
