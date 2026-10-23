// 지수 4개 (SPEC 3장). 지수는 날씨처럼 오르내린다. 레벨·작물에는 영향을 주지 않는다.
// SPEC 3장 [확정] 2026-10-20 — 최근 7일 기록 기준, 0~100. 값 조정은 이 파일의 상수만 바꾸면 된다.

import { addDays, daysBetween, type DayKey } from './day';
import { fireBand, fireIndex, logContacts, NO_REST, type FireBand, type RestSource } from './fire';
import { FREQUENCY_WINDOW_DAYS, mergeContacts, type ContactDays, type Frequency } from './neighbors';
import type { Condition, DayRecord, IndexKind, WorkLevel } from './types';

export type { Frequency };

/** 최근 며칠을 볼지 */
export const INDEX_WINDOW_DAYS = 7;

const CONDITION_SCORE: Record<Condition, number> = { 1: 0, 2: 50, 3: 100 };
const WORK_SCORE: Record<WorkLevel, number> = { 1: 20, 2: 55, 3: 90 };

/** 관계: 최근 7일 연락이 이만큼이면 연락 수 점수 만점 */
export const RELATION_FULL_CONTACTS = 5;


export type IndexNeighbor = { id: string; frequency: Frequency; lastContact: DayKey | null };

export type Indices = Record<IndexKind, number | null>;

/** end 포함 최근 n일 기록 (end에서 i일 전 → i) */
function windowRecords<T>(records: Readonly<Record<DayKey, T>>, end: DayKey, n: number) {
  const out: { ago: number; r: T }[] = [];
  for (let i = 0; i < n; i++) {
    const r = records[addDays(end, -i)];
    if (r) out.push({ ago: i, r });
  }
  return out;
}

/** 건강: 컨디션 점수의 가중 평균. 최근일일수록 무겁다 (오늘 7 … 6일 전 1). */
export function healthIndex(records: Readonly<Record<DayKey, DayRecord>>, end: DayKey): number | null {
  const w = windowRecords(records, end, INDEX_WINDOW_DAYS);
  if (!w.length) return null;
  let sum = 0;
  let weight = 0;
  for (const { ago, r } of w) {
    const k = INDEX_WINDOW_DAYS - ago;
    sum += CONDITION_SCORE[r.condition] * k;
    weight += k;
  }
  return Math.round(sum / weight);
}

/** 일: 일 강도 점수 평균. 높을수록 주의 신호. */
export function workIndex(records: Readonly<Record<DayKey, DayRecord>>, end: DayKey): number | null {
  const w = windowRecords(records, end, INDEX_WINDOW_DAYS);
  if (!w.length) return null;
  // 쉬는 날에 일 강도를 안 적었으면 일 0으로 센다 (2026-10-23 사용자 결정)
  return Math.round(w.reduce((a, { r }) => a + (r.work ? WORK_SCORE[r.work] : 0), 0) / w.length);
}

/** 기준일(end) 시점의 마지막 연락 날짜. end 이후 연락은 보지 않는다. */
function lastContactAsOf(
  records: ContactDays,
  n: IndexNeighbor,
  end: DayKey,
): DayKey | null {
  if (n.lastContact !== null && daysBetween(n.lastContact, end) >= 0) return n.lastContact;
  let last: DayKey | null = null;
  for (const r of Object.values(records)) {
    if (daysBetween(r.date, end) < 0) continue;
    if (r.contacts.some((c) => c.neighborId === n.id) && (last === null || r.date > last)) last = r.date;
  }
  return last;
}

/**
 * 관계: 최근 7일 연락 수 점수와 이웃별 연락 주기 충족 비율의 평균.
 * 등록한 이웃이 없거나 최근 7일 기록이 없으면 null.
 */
export function relationIndex(
  records: ContactDays,
  neighbors: readonly IndexNeighbor[],
  end: DayKey,
): number | null {
  const w = windowRecords(records, end, INDEX_WINDOW_DAYS);
  if (!neighbors.length || !w.length) return null;
  const contacts = w.reduce((a, { r }) => a + r.contacts.length, 0);
  const countScore = Math.min(1, contacts / RELATION_FULL_CONTACTS);
  const met = neighbors.filter((n) => {
    const last = lastContactAsOf(records, n, end);
    return last !== null && daysBetween(last, end) < FREQUENCY_WINDOW_DAYS[n.frequency];
  }).length;
  const freqScore = met / neighbors.length;
  return Math.round((100 * (countScore + freqScore)) / 2);
}

/**
 * 쉼 = 모닥불 (디자인 v8 TURN 15): 최근 7일 장작 점수 합, 상한 100. 계산은 fire.ts.
 * 기록도 장작도 다녀온 곳도 7일 안에 없으면 null.
 */
export function leisureIndex(records: Readonly<Record<DayKey, DayRecord>>, end: DayKey, rest: RestSource = NO_REST): number | null {
  return fireIndex(rest, end, (d) => !!records[d]);
}

export function computeIndices(
  records: Readonly<Record<DayKey, DayRecord>>,
  neighbors: readonly IndexNeighbor[],
  end: DayKey,
  rest: RestSource = NO_REST,
): Indices {
  // 쉼 기록의 이웃 태그는 그날 '만남' 연락으로 센다
  const contacts = mergeContacts(records, logContacts(rest.logs, (id) => neighbors.some((n) => n.id === id)));
  return {
    health: healthIndex(records, end),
    work: workIndex(records, end),
    relation: relationIndex(contacts, neighbors, end),
    leisure: leisureIndex(records, end, rest),
  };
}

// ── 상태 문구 단계 (문구 자체는 copy/labels.ko.ts) ──────────────────────

export type WorkBand = 'easy' | 'normal' | 'busy' | 'overtime';
export function workBand(v: number): WorkBand {
  return v >= 80 ? 'overtime' : v >= 60 ? 'busy' : v >= 35 ? 'normal' : 'easy';
}

export type RelationBand = 'bestFriend' | 'lively' | 'normal' | 'quiet';
export function relationBand(v: number, hasBestFriend: boolean): RelationBand {
  if (hasBestFriend) return 'bestFriend';
  return v >= 60 ? 'lively' : v >= 30 ? 'normal' : 'quiet';
}

/** 쉼 상태 = 불 상태 (활활 / 타오름 / 사그라듦 / 꺼져감) */
export type LeisureBand = FireBand;
export const leisureBand = fireBand;

/** 일 과열 기준 (등불·방송) */
export const WORK_OVERHEAT = 80;
/** 여가 부족 기준 (방송) */
export const LEISURE_LOW = 20;

// ── 최근 4주 추세 (7d) ──────────────────────────────────────────────────

export const TREND_WEEKS = 4;

/** 오래된 주 → 이번 주. 각 주 마지막 날 기준 지수. */
export function weeklyTrend(
  kind: IndexKind,
  records: Readonly<Record<DayKey, DayRecord>>,
  neighbors: readonly IndexNeighbor[],
  end: DayKey,
  rest: RestSource = NO_REST,
): (number | null)[] {
  const out: (number | null)[] = [];
  for (let w = TREND_WEEKS - 1; w >= 0; w--) out.push(computeIndices(records, neighbors, addDays(end, -7 * w), rest)[kind]);
  return out;
}

/** 첫 주와 이번 주의 차이 → 추세 단계 (기록 있는 주가 2개 미만이면 unknown) */
export const TREND_STEP = { big: 15, small: 5 } as const;

export type TrendBand = 'up' | 'slightlyUp' | 'flat' | 'slightlyDown' | 'down' | 'unknown';

export function trendBand(values: readonly (number | null)[]): TrendBand {
  const known = values.filter((v): v is number => v !== null);
  if (known.length < 2) return 'unknown';
  const diff = known[known.length - 1] - known[0];
  if (diff >= TREND_STEP.big) return 'up';
  if (diff >= TREND_STEP.small) return 'slightlyUp';
  if (diff > -TREND_STEP.small) return 'flat';
  if (diff > -TREND_STEP.big) return 'slightlyDown';
  return 'down';
}
