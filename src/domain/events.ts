// 행사 D-day · 마을 게시판 · 달력 표시 (SPEC 8장). 이장네 장부에는 행사만 적는다.
// 일상 기록과 시스템 기록(자동 수확, 레벨업)은 장부에 넣지 않는다.
// 디자인 v5 TURN 11 [확정 2026-10-21]: 현수막 대신 마을 게시판에 가까운 행사 최대 3개를 쪽지로 붙인다.
// 장부 개선안 [2026-10-31]: 여러 날에 걸친 일정(시작일 ~ 종료일), 지나간 일 영역 삭제.

import { addDays, daysBetween, type DayKey } from './day';

/** 장부에서 앞으로 몇 달까지 넘겨 볼 수 있나 (달력 다음 화살표) */
export const LEDGER_MONTHS_AHEAD = 12;

/** 행사 분류 5종 (디자인 11a) */
export type EventType = 'travel' | 'birth' | 'work' | 'meet' | 'etc';
export const EVENT_TYPES: readonly EventType[] = ['travel', 'birth', 'work', 'meet', 'etc'];
/** 새 행사의 처음 분류 */
export const DEFAULT_EVENT_TYPE: EventType = 'meet';

export type VillageEvent = {
  id: string;
  name: string;
  /** 시작일(처음 날짜). 매년 반복이면 월·일만 쓴다. D-day는 시작일 기준. */
  date: DayKey;
  /** 종료일: 여러 날에 걸친 일정일 때만 (시작일보다 뒤). 하루 일정 · 매년 반복은 null */
  endDate: DayKey | null;
  type: EventType;
  /** 매년 반복 (생일에서만 고를 수 있다) */
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

// ── 기간 ────────────────────────────────────────────────────────────────

/** 마지막 날 (하루 일정이면 시작일) */
export const eventLastDay = (e: Pick<VillageEvent, 'date' | 'endDate'>): DayKey => e.endDate ?? e.date;

/** 며칠짜리인가 (하루 = 1) */
export const eventLength = (e: Pick<VillageEvent, 'date' | 'endDate'>): number => daysBetween(e.date, eventLastDay(e)) + 1;

/** 시작일 · 종료일 → 저장할 종료일. 같은 날이거나 시작보다 앞이면 하루 일정(null) */
export function normalizeEnd(start: DayKey, end: DayKey | null): DayKey | null {
  return end !== null && end > start ? end : null;
}

/** 날짜 고르기 상태 (행사 등록 시트): 'end' = 시작일을 눌렀고 종료일을 기다리는 중, 'done' = 기간이 정해짐 */
export type RangeSelection = { start: DayKey; end: DayKey | null; step: 'end' | 'done' };

/** 처음 상태: 시작일만 있는 하루 일정 (다음에 누르면 새로 고른다) */
export const rangeOf = (start: DayKey, end: DayKey | null = null): RangeSelection => ({ start, end: normalizeEnd(start, end), step: 'done' });

/**
 * 날짜를 눌렀을 때: 시작일 → 종료일 순서로 기간을 고른다.
 *  - 기간 선택이 끝난 뒤 다시 누르면 새로 시작한다 (눌린 날이 시작일).
 *  - 종료일을 기다리는 중에 시작일보다 앞선 날을 누르면 시작일이 바뀐다.
 *  - 같은 날을 두 번 누르면 하루 일정이 된다.
 */
export function pickRange(sel: RangeSelection, day: DayKey): RangeSelection {
  if (sel.step === 'done') return { start: day, end: null, step: 'end' };
  if (day < sel.start) return { start: day, end: null, step: 'end' };
  if (day === sel.start) return { start: sel.start, end: null, step: 'done' };
  return { start: sel.start, end: day, step: 'done' };
}

// ── 다음에 오는 날 · 달력 ───────────────────────────────────────────────

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

/** 이 행사가 그 달에 차지하는 날들 (여러 날 일정은 기간의 모든 날, 매년 반복은 그해 그날) */
function daysInMonthOf(e: VillageEvent, year: number, month: number): DayKey[] {
  const prefix = `${year}-${pad(month)}-`;
  if (e.repeatYearly) {
    const d = sameDayIn(year, e.date);
    return d.startsWith(prefix) && daysBetween(e.date, d) >= 0 ? [d] : [];
  }
  const out: DayKey[] = [];
  const last = eventLastDay(e);
  for (let d = e.date; d <= last; d = addDays(d, 1)) if (d.startsWith(prefix)) out.push(d);
  return out;
}

/**
 * 달력 칸 아래 분류 색 막대: 날짜 → 그날 걸친 행사 분류들 (중복 없이, 먼저 적은 행사 순).
 * 여러 날 일정은 기간의 모든 날짜에 들어간다.
 */
export function eventTypesByDay(events: readonly VillageEvent[], year: number, month: number): Map<DayKey, EventType[]> {
  const out = new Map<DayKey, EventType[]>();
  for (const e of [...events].sort((a, b) => a.createdAt - b.createdAt)) {
    for (const d of daysInMonthOf(e, year, month)) {
      const list = out.get(d) ?? [];
      if (!list.includes(e.type)) list.push(e.type);
      out.set(d, list);
    }
  }
  return out;
}

/** 행사가 걸친 날 → 분류 (같은 날 여럿이면 먼저 적은 행사의 분류). 쉼터 쪽지의 "비어 있는 날" 계산이 쓴다. */
export function eventDaysInMonth(events: readonly VillageEvent[], year: number, month: number): Map<DayKey, EventType> {
  const out = new Map<DayKey, EventType>();
  for (const [d, types] of eventTypesByDay(events, year, month)) out.set(d, types[0]);
  return out;
}

/** 그날에 걸친 행사들 (장부에서 날짜를 눌렀을 때 하단 리스트). 먼저 적은 순. 매년 반복은 그해 그날. */
export function eventsOnDay(events: readonly VillageEvent[], day: DayKey): VillageEvent[] {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  return events.filter((e) => daysInMonthOf(e, year, month).includes(day)).sort((a, b) => a.createdAt - b.createdAt);
}

// ── 다가오는 행사 · 게시판 ─────────────────────────────────────────────

/** 오늘 포함 앞으로의 행사(진행 중인 여러 날 일정 포함), 시작이 가까운 순. date는 다음에 오는 시작일로 바꿔서 준다. */
export function upcomingEvents(events: readonly VillageEvent[], today: DayKey): VillageEvent[] {
  return events
    .map((e) => ({ ...e, date: nextOccurrence(e, today) }))
    .filter((e) => daysBetween(today, eventLastDay(e)) >= 0)
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
