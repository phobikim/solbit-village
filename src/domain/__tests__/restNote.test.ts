import type { VillageEvent } from '../events';
import type { Place } from '../rest';
import {
  drawNote,
  EMPTY_NOTE_STATE,
  freeWeekendDay,
  noteOpen,
  NOTE_REPEAT_DAYS,
  parseNoteState,
  pruneNoteState,
  todayNote,
  weekWord,
} from '../restNote';

const place = (id: string, over: Partial<Place> = {}): Place => ({
  id,
  name: id,
  duration: 'half',
  visited: false,
  memo: null,
  note: null,
  eventId: null,
  logId: null,
  visitedDate: null,
  nights: 0,
  addedDate: '2026-08-01',
  createdAt: 0,
  ...over,
});
const ev = (date: string, over: Partial<VillageEvent> = {}): VillageEvent => ({
  id: `e${date}`,
  name: '일정',
  date,
  type: 'etc',
  repeatYearly: false,
  createdAt: 0,
  ...over,
});

const today = '2026-10-22'; // 목요일 → 토 24일, 일 25일

describe('쪽지는 사그라듦 이하일 때만', () => {
  it('불 상태', () => {
    expect(noteOpen('dying')).toBe(true);
    expect(noteOpen('out')).toBe(true);
    expect(noteOpen('burning')).toBe(false);
    expect(noteOpen('blaze')).toBe(false);
    expect(noteOpen(null)).toBe(false);
  });
});

describe('이번 토요일 비어 있던디 — 다가오는 토 · 일 중 일정 없는 날', () => {
  it('토요일이 비면 토요일', () => {
    expect(freeWeekendDay([], today)).toBe('2026-10-24');
  });
  it('토요일에 대소사 일정이 있으면 일요일', () => {
    expect(freeWeekendDay([ev('2026-10-24')], today)).toBe('2026-10-25');
  });
  it('이번 주말이 다 찼으면 다음 주말까지는 보지 않는다 (7일 안)', () => {
    expect(freeWeekendDay([ev('2026-10-24'), ev('2026-10-25')], today)).toBeNull();
  });
  it('매년 반복 행사도 일정으로 센다', () => {
    expect(freeWeekendDay([ev('2020-10-24', { repeatYearly: true, type: 'birth' })], today)).toBe('2026-10-25');
  });
  it('오늘이 토요일이면 오늘은 빼고 내일(일요일)부터', () => {
    expect(freeWeekendDay([], '2026-10-24')).toBe('2026-10-25');
  });
  it('일요일 저녁에는 다음 토요일 (다음 주)', () => {
    expect(freeWeekendDay([], '2026-10-25')).toBe('2026-10-31');
    expect(weekWord('2026-10-31', '2026-10-25')).toBe('다음');
    expect(weekWord('2026-10-24', today)).toBe('이번');
  });
  it('달이 바뀌어도 본다', () => {
    expect(freeWeekendDay([ev('2026-11-01')], '2026-10-29')).toBe('2026-10-31');
    expect(freeWeekendDay([ev('2026-10-31')], '2026-10-29')).toBe('2026-11-01');
  });
});

describe('쪽지 고르기: 보따리 깃발에서 1장, 확률 없음', () => {
  const places = [place('속초', { createdAt: 1 }), place('교토', { createdAt: 2 }), place('담양', { createdAt: 3 })];

  it('오래 담아둔 깃발부터', () => {
    const d = todayNote(places, EMPTY_NOTE_STATE, today);
    expect(d?.place.id).toBe('속초');
    expect(d?.state.offers).toEqual({ 속초: today });
    expect(d?.state.current).toEqual({ date: today, placeId: '속초' });
  });
  it('날짜가 이미 잡힌 깃발 · 다녀온 곳은 제안하지 않는다', () => {
    const list = [place('사파', { eventId: 'e1', createdAt: 0 }), place('제주', { visited: true, createdAt: 0 }), place('교토', { createdAt: 5 })];
    expect(todayNote(list, EMPTY_NOTE_STATE, today)?.place.id).toBe('교토');
  });
  it('오늘 보여 준 쪽지는 다시 열어도 같은 쪽지', () => {
    const first = todayNote(places, EMPTY_NOTE_STATE, today)!;
    const again = todayNote(places, first.state, today)!;
    expect(again.place.id).toBe('속초');
    expect(again.state).toBe(first.state);
  });
  it('[다른 쪽지]: 지금 쪽지는 빼고 다음 장소', () => {
    const first = todayNote(places, EMPTY_NOTE_STATE, today)!;
    const second = drawNote(places, first.state, today)!;
    expect(second.place.id).toBe('교토');
    const third = drawNote(places, second.state, today)!;
    expect(third.place.id).toBe('담양');
    expect(drawNote(places, third.state, today)).toBeNull(); // 다 봤다
  });
  it('같은 장소는 7일 안에 다시 제안하지 않는다', () => {
    const state = { offers: { 속초: '2026-10-16' }, current: null }; // 6일 전
    expect(todayNote(places, state, today)?.place.id).toBe('교토');
    expect(NOTE_REPEAT_DAYS).toBe(7);
  });
  it('딱 7일이 지나면 다시 제안할 수 있다', () => {
    const state = { offers: { 속초: '2026-10-15' }, current: null }; // 7일 전
    expect(todayNote(places, state, today)?.place.id).toBe('속초');
  });
  it('전날 쪽지는 다음 날 새 쪽지 (어제 보여 준 장소는 7일 동안 쉰다)', () => {
    const yesterday = todayNote(places, EMPTY_NOTE_STATE, '2026-10-21')!;
    const next = todayNote(places, yesterday.state, today)!;
    expect(next.place.id).toBe('교토');
  });
  it('쪽지로 보여 주던 깃발이 찜(날짜 잡힘)되면 다음 쪽지로', () => {
    const first = todayNote(places, EMPTY_NOTE_STATE, today)!;
    const picked = places.map((p) => (p.id === '속초' ? { ...p, eventId: 'e1' } : p));
    expect(todayNote(picked, first.state, today)?.place.id).toBe('교토');
  });
  it('깃발이 하나도 없으면 null', () => {
    expect(todayNote([place('제주', { visited: true })], EMPTY_NOTE_STATE, today)).toBeNull();
  });
});

describe('제안 기억 저장', () => {
  it('JSON 왕복 · 깨진 값은 빈 상태', () => {
    const state = { offers: { 속초: today }, current: { date: today, placeId: '속초' } };
    expect(parseNoteState(JSON.stringify(state))).toEqual(state);
    expect(parseNoteState('{망가짐')).toEqual(EMPTY_NOTE_STATE);
    expect(parseNoteState(null)).toEqual(EMPTY_NOTE_STATE);
    expect(parseNoteState(JSON.stringify({ offers: { a: 1 }, current: 3 }))).toEqual(EMPTY_NOTE_STATE);
  });
  it('7일 지난 기록 · 지워진 장소는 정리하되 7일 안 기록은 남긴다', () => {
    const state = { offers: { 속초: '2026-10-20', 교토: '2026-10-01', 없는곳: '2026-10-21' }, current: { date: '2026-10-21', placeId: '없는곳' } };
    const pruned = pruneNoteState(state, [place('속초'), place('교토')], today);
    expect(pruned.offers).toEqual({ 속초: '2026-10-20' });
    expect(pruned.current).toBeNull();
  });
});
