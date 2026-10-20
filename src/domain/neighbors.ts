// 이웃 규칙 (SPEC 7장). 가까운 이웃을 부각하고, 소홀한 이웃을 경고처럼 다루지 않는다 (CLAUDE.md 규칙 6).

import { addDays, daysBetween, parseDayKey, type DayKey, type YearMonth } from './day';
import type { DayRecord } from './types';

// ── 가까움 — SPEC 7장 [확정] 2026-10-20 ─────────────────────────────────

/** 연락 주기별 기준일 */
export const FREQUENCY_WINDOW_DAYS = { often: 7, sometimes: 30, rarely: 90 } as const;
export type Frequency = keyof typeof FREQUENCY_WINDOW_DAYS;

/** (마지막 연락 후 경과일 ÷ 기준일) 상한 → 단계. 2를 넘으면 '안부 묻기 좋은 이웃'. */
export const CLOSENESS_RATIO = { close: 0.5, normal: 1, distant: 2 } as const;

export type Closeness = 'close' | 'normal' | 'distant' | 'askAfter';

/**
 * 경과 비율. 연락한 적이 없으면 등록한 날부터 센다.
 */
export function closenessRatio(
  frequency: Frequency,
  lastContact: DayKey | null,
  registeredOn: DayKey,
  today: DayKey,
): number {
  const since = lastContact ?? registeredOn;
  return Math.max(0, daysBetween(since, today)) / FREQUENCY_WINDOW_DAYS[frequency];
}

export function closenessOf(ratio: number): Closeness {
  if (ratio <= CLOSENESS_RATIO.close) return 'close';
  if (ratio <= CLOSENESS_RATIO.normal) return 'normal';
  if (ratio <= CLOSENESS_RATIO.distant) return 'distant';
  return 'askAfter';
}

/** 이번 달 연락 횟수 */
export function monthContactCount(
  records: Readonly<Record<DayKey, DayRecord>>,
  month: YearMonth,
  neighborId: string,
): number {
  let n = 0;
  for (const r of Object.values(records)) {
    const { year, month: m } = parseDayKey(r.date);
    if (year === month.year && m === month.month) n += r.contacts.filter((c) => c.neighborId === neighborId).length;
  }
  return n;
}

/** 마을에 놀러 와 있는 이웃 최대 수 */
export const VILLAGE_VISITOR_MAX = 2;
/** 어제 연락이 없을 때, 최근 며칠 연락 많은 이웃으로 채울지 */
export const VISITOR_LOOKBACK_DAYS = 14;

/**
 * 이번 달 단짝: 이번 달 연락(만남·통화·메시지)이 가장 많은 이웃.
 * 같으면 더 최근에 연락한 이웃. 한 번도 없으면 null.
 */
export function bestFriendOf(records: Readonly<Record<DayKey, DayRecord>>, month: YearMonth): string | null {
  const count = new Map<string, { n: number; last: DayKey }>();
  for (const r of Object.values(records)) {
    const { year, month: m } = parseDayKey(r.date);
    if (year !== month.year || m !== month.month) continue;
    for (const c of r.contacts) {
      const cur = count.get(c.neighborId) ?? { n: 0, last: r.date };
      count.set(c.neighborId, { n: cur.n + 1, last: r.date > cur.last ? r.date : cur.last });
    }
  }
  let best: { id: string; n: number; last: DayKey } | null = null;
  for (const [id, v] of count) {
    if (!best || v.n > best.n || (v.n === best.n && v.last > best.last)) best = { id, ...v };
  }
  return best?.id ?? null;
}

/**
 * 마을에 놀러 와 있는 이웃 id. 어제 연락한 이웃이 먼저(만남 우선),
 * 자리가 남으면 최근 14일 연락이 많은 가까운 이웃으로 채운다.
 */
export function villageVisitors(
  records: Readonly<Record<DayKey, DayRecord>>,
  today: DayKey,
  activeIds: ReadonlySet<string>,
  max = VILLAGE_VISITOR_MAX,
): string[] {
  const out: string[] = [];
  const yesterday = records[addDays(today, -1)];
  if (yesterday) {
    const sorted = [...yesterday.contacts].sort((a, b) => Number(b.method === 'meet') - Number(a.method === 'meet'));
    for (const c of sorted) if (activeIds.has(c.neighborId) && !out.includes(c.neighborId)) out.push(c.neighborId);
  }
  if (out.length < max) {
    const count = new Map<string, number>();
    for (let i = 0; i < VISITOR_LOOKBACK_DAYS; i++) {
      for (const c of records[addDays(today, -i)]?.contacts ?? []) count.set(c.neighborId, (count.get(c.neighborId) ?? 0) + 1);
    }
    [...count.entries()]
      .filter(([id]) => activeIds.has(id) && !out.includes(id))
      .sort((a, b) => b[1] - a[1])
      .forEach(([id]) => out.push(id));
  }
  return out.slice(0, max);
}

/** 어제 연락한 이웃이 마을에 와 있는가 (방송용) */
export function visitedFromYesterday(records: Readonly<Record<DayKey, DayRecord>>, today: DayKey, id: string): boolean {
  return !!records[addDays(today, -1)]?.contacts.some((c) => c.neighborId === id);
}

/** 기록 시트 "누구와"에 바로 보일 이웃 수 */
export const QUICK_NEIGHBOR_COUNT = 6;

export type NeighborContactStat = {
  id: string;
  name: string;
  createdAt: number;
  /** 전체 연락 횟수 */
  contactCount: number;
  /** 마지막 연락 날짜 (없으면 null) */
  lastContact: string | null;
};

/**
 * 기록 시트에 바로 보일 "자주 연락하는 이웃".
 * 연락 많은 순 → 최근 연락 순 → 먼저 등록한 순.
 */
export function frequentNeighbors<T extends NeighborContactStat>(all: readonly T[], n = QUICK_NEIGHBOR_COUNT): T[] {
  return [...all]
    .sort(
      (a, b) =>
        b.contactCount - a.contactCount ||
        (b.lastContact ?? '').localeCompare(a.lastContact ?? '') ||
        a.createdAt - b.createdAt,
    )
    .slice(0, n);
}
