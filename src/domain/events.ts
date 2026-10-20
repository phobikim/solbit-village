// 행사 D-day · 지나간 일 (SPEC 8장). 이장네 장부에는 행사와 성취만 적는다.
// 일상 기록과 시스템 기록(자동 수확, 레벨업)은 장부에 넣지 않는다.

import { addDays, daysBetween, type DayKey } from './day';
import type { DayRecord } from './types';

export type EventType = 'anniversary' | 'schedule' | 'etc';

export type VillageEvent = {
  id: string;
  name: string;
  date: DayKey;
  type: EventType;
  createdAt: number;
};

export const EVENT_NAME_MAX = 20;

/** 오늘 포함 앞으로의 행사, 가까운 순 */
export function upcomingEvents(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  return events
    .filter((e) => daysBetween(today, e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/** 마을 입구 현수막에 걸 행사: 가장 가까운 다가오는 행사 하나 */
export function bannerEvent(events: readonly VillageEvent[], today: DayKey): VillageEvent | null {
  return upcomingEvents(events, today)[0] ?? null;
}

/** 내일이 행사인 것 (방송용) */
export function eventsTomorrow(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  const tomorrow = addDays(today, 1);
  return events.filter((e) => e.date === tomorrow);
}

export type PastItem =
  | { kind: 'event'; date: DayKey; event: VillageEvent }
  | { kind: 'achievement'; date: DayKey; text: string };

export type Achievement = { date: DayKey; text: string };

/** 기록 → 장부에 올라갈 성취 */
export function achievementsOf(records: readonly DayRecord[]): Achievement[] {
  return records.filter((r) => r.achievement).map((r) => ({ date: r.date, text: r.achievement as string }));
}

/**
 * 지나간 일: 날짜가 지난 행사(자동 이동) + 기록 시트의 "오늘의 성취". 최근 순.
 */
export function pastItems(
  events: readonly VillageEvent[],
  achievements: readonly Achievement[],
  today: DayKey,
): PastItem[] {
  const items: PastItem[] = [
    ...events.filter((e) => daysBetween(today, e.date) < 0).map((e) => ({ kind: 'event' as const, date: e.date, event: e })),
    ...achievements.map((a) => ({ kind: 'achievement' as const, date: a.date, text: a.text })),
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date) || (a.kind === 'event' ? -1 : 1));
}
