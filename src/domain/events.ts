// 행사 D-day · 마을 게시판 · 지나간 일 (SPEC 8장). 이장네 장부에는 행사와 성취만 적는다.
// 일상 기록과 시스템 기록(자동 수확, 레벨업)은 장부에 넣지 않는다.
// 디자인 v5 TURN 11 [확정 2026-10-21]: 현수막 대신 마을 게시판에 가까운 행사 최대 3개를 쪽지로 붙인다.

import { addDays, daysBetween, type DayKey } from './day';
import type { DayRecord } from './types';

/** 행사 분류 5종 (디자인 11a) */
export type EventType = 'travel' | 'birth' | 'work' | 'meet' | 'etc';
export const EVENT_TYPES: readonly EventType[] = ['travel', 'birth', 'work', 'meet', 'etc'];

export type VillageEvent = {
  id: string;
  name: string;
  /** 처음 날짜. 매년 반복이면 월·일만 쓴다. */
  date: DayKey;
  type: EventType;
  /** 매년 반복 (생일·기념일에서만 고를 수 있다) */
  repeatYearly: boolean;
  createdAt: number;
};

export const EVENT_NAME_MAX = 20;

/** 마을 게시판에 붙이는 행사 수 */
export const BOARD_MAX = 3;

/** 매년 반복을 고를 수 있는 분류 */
export const REPEATABLE_TYPES: readonly EventType[] = ['birth'];

const pad = (n: number) => String(n).padStart(2, '0');
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** 그해의 같은 월·일 (2월 29일은 평년이면 2월 28일) */
function sameDayIn(year: number, date: DayKey): DayKey {
  const [, m, d] = date.split('-').map(Number);
  const day = m === 2 && d === 29 && !isLeap(year) ? 28 : d;
  return `${year}-${pad(m)}-${pad(day)}`;
}

/**
 * 이 행사가 오늘 이후(오늘 포함) 처음 오는 날. 반복이 아니면 원래 날짜(지났으면 지난 날짜 그대로).
 * 매년 반복은 올해 그날이 지났으면 내년 그날. 처음 날짜보다 앞서지는 않는다.
 */
export function nextOccurrence(e: VillageEvent, today: DayKey): DayKey {
  if (!e.repeatYearly) return e.date;
  const year = Number(today.slice(0, 4));
  for (const y of [year, year + 1]) {
    const d = sameDayIn(y, e.date);
    if (daysBetween(today, d) >= 0 && daysBetween(e.date, d) >= 0) return d;
  }
  return e.date;
}

/** 오늘 포함 앞으로의 행사, 가까운 순. date는 다음에 오는 날로 바꿔서 준다. */
export function upcomingEvents(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  return events
    .map((e) => ({ ...e, date: nextOccurrence(e, today) }))
    .filter((e) => daysBetween(today, e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/** 마을 게시판에 붙일 행사: 가까운 순 최대 3개 (맨 앞이 가장 가까운 행사) */
export function boardEvents(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  return upcomingEvents(events, today).slice(0, BOARD_MAX);
}

/** 오늘이 행사인 것 (게시판 '오늘!' · 방송) */
export function eventsToday(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  return upcomingEvents(events, today).filter((e) => e.date === today);
}

/** 내일이 행사인 것 (방송용) */
export function eventsTomorrow(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  const tomorrow = addDays(today, 1);
  return upcomingEvents(events, today).filter((e) => e.date === tomorrow);
}

/** 꼭 일주일 남은 것 (방송용) */
export function eventsInAWeek(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  const week = addDays(today, 7);
  return upcomingEvents(events, today).filter((e) => e.date === week);
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
 * 지나간 일: 날짜가 지난 행사(자동 이동, 매년 반복은 제외) + 기록 시트의 "오늘의 성취". 최근 순.
 */
export function pastItems(
  events: readonly VillageEvent[],
  achievements: readonly Achievement[],
  today: DayKey,
): PastItem[] {
  const items: PastItem[] = [
    ...events
      .filter((e) => !e.repeatYearly && daysBetween(today, e.date) < 0)
      .map((e) => ({ kind: 'event' as const, date: e.date, event: e })),
    ...achievements.map((a) => ({ kind: 'achievement' as const, date: a.date, text: a.text })),
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date) || (a.kind === 'event' ? -1 : 1));
}
