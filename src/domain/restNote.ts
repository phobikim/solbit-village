// 쪽지 제안 (디자인 v8 15a). 불이 사그라듦 이하일 때 이장이 보따리 깃발에서 한 장을 꺼내 제안한다.
// 확률 없음: 오래 담아둔 깃발부터, 같은 장소는 7일 안에 다시 제안하지 않는다.

import { addDays, daysBetween, parseDayKey, weekdayOf, type DayKey } from './day';
import { eventDaysInMonth, type VillageEvent } from './events';
import { NOTE_BANDS, type FireBand } from './fire';
import type { Place } from './rest';

/** 같은 장소를 다시 제안하기까지 기다리는 날 수 */
export const NOTE_REPEAT_DAYS = 7;

/** 제안 기억: 장소별로 마지막에 보여 준 날, 오늘 보여 주는 쪽지 */
export type NoteState = {
  offers: Record<string, DayKey>;
  current: { date: DayKey; placeId: string } | null;
};
export const EMPTY_NOTE_STATE: NoteState = { offers: {}, current: null };

/** 쪽지가 나오는 불 상태인가 (사그라듦 이하) */
export const noteOpen = (band: FireBand | null) => band !== null && NOTE_BANDS.includes(band);

/** 다가오는 토·일 중 대소사 일정이 없는 첫 날 (내일부터 7일 안). 없으면 null. */
export function freeWeekendDay(events: readonly VillageEvent[], today: DayKey): DayKey | null {
  const busy = new Map<string, Set<DayKey>>();
  const busyOf = (d: DayKey) => {
    const { year, month } = parseDayKey(d);
    const key = `${year}-${month}`;
    if (!busy.has(key)) busy.set(key, new Set(eventDaysInMonth(events, year, month).keys()));
    return busy.get(key)!;
  };
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, i);
    const w = weekdayOf(d);
    if ((w === 6 || w === 0) && !busyOf(d).has(d)) return d;
  }
  return null;
}

/** 이번 주(월~일) 안인가 → "이번", 아니면 "다음" */
export function weekWord(day: DayKey, today: DayKey): '이번' | '다음' {
  const mon = addDays(today, -((weekdayOf(today) + 6) % 7));
  const d = daysBetween(mon, day);
  return d >= 0 && d < 7 ? '이번' : '다음';
}

/** 제안할 수 있는 깃발: 날짜가 안 잡혔고, 7일 안에 보여 준 적 없는 곳 */
function candidates(places: readonly Place[], state: NoteState, today: DayKey): Place[] {
  return places
    .filter((p) => !p.visited && !p.eventId)
    .filter((p) => {
      const last = state.offers[p.id];
      return last === undefined || daysBetween(last, today) >= NOTE_REPEAT_DAYS;
    })
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export type NoteDraw = { place: Place; state: NoteState };

/**
 * 오늘의 쪽지. 오늘 이미 보여 준 쪽지가 있고 그 깃발이 그대로면 같은 쪽지를 돌려준다.
 * 새로 꺼내면 오늘 보여 준 것으로 기억한다. 꺼낼 깃발이 없으면 null.
 */
export function todayNote(places: readonly Place[], state: NoteState, today: DayKey): NoteDraw | null {
  const cur = state.current;
  if (cur && cur.date === today) {
    const p = places.find((x) => x.id === cur.placeId && !x.visited && !x.eventId);
    if (p) return { place: p, state };
  }
  return drawNote(places, state, today);
}

/** [다른 쪽지]: 지금 쪽지(오늘 보여 줌)는 빼고 다음 깃발. 없으면 null (지금 쪽지를 그대로 두면 된다). */
export function drawNote(places: readonly Place[], state: NoteState, today: DayKey): NoteDraw | null {
  const next = candidates(places, state, today)[0];
  if (!next) return null;
  return {
    place: next,
    state: { offers: { ...state.offers, [next.id]: today }, current: { date: today, placeId: next.id } },
  };
}

/** 오래된 제안 기록 정리 (지난 장소 · 7일 지난 날짜는 더 안 써도 된다) */
export function pruneNoteState(state: NoteState, places: readonly Place[], today: DayKey): NoteState {
  const alive = new Set(places.map((p) => p.id));
  const offers = Object.fromEntries(
    Object.entries(state.offers).filter(([id, d]) => alive.has(id) && daysBetween(d, today) < NOTE_REPEAT_DAYS),
  );
  return { offers, current: state.current && alive.has(state.current.placeId) ? state.current : null };
}

export function parseNoteState(json: string | null): NoteState {
  if (!json) return EMPTY_NOTE_STATE;
  try {
    const v = JSON.parse(json) as Partial<NoteState>;
    const offers: Record<string, DayKey> = {};
    for (const [k, d] of Object.entries(v.offers ?? {})) if (typeof d === 'string') offers[k] = d;
    const c = v.current;
    return { offers, current: c && typeof c.date === 'string' && typeof c.placeId === 'string' ? c : null };
  } catch {
    return EMPTY_NOTE_STATE;
  }
}
