// 하루 기록 규칙 (SPEC 4장).

import { daysBetween, weekdayOf, type DayKey } from './day';
import { DEFAULT_REST_SIZE, type RestLog, type RestSize } from './fire';
import type { Condition, Contact, DayRecord, DayType, WorkLevel } from './types';

/**
 * 지난 기록 수정 허용 기간 (오늘 포함 일수). 오늘과 지난 6일까지 고칠 수 있다.
 * SPEC 4장 — 2026-10-20 사용자 결정으로 확정. 고쳐도 이미 심은 작물은 바뀌지 않는다.
 */
export const RECORD_EDIT_WINDOW_DAYS = 7;

/** 여가 기본 칩 */
export const LEISURE_PRESETS = ['산책', '운동', '영화', '휴식'] as const;

/** 성취·메모·여가 직접 입력 최대 길이 */
export const TEXT_MAX_LENGTH = 60;
export const LEISURE_MAX_LENGTH = 12;

/** 이 날짜의 기록을 고칠 수 있는가 (이미 있는 기록 기준) */
export function canEditRecord(date: DayKey, today: DayKey): boolean {
  const ago = daysBetween(date, today);
  return ago >= 0 && ago < RECORD_EDIT_WINDOW_DAYS;
}

/**
 * 이 날짜에 새 기록을 만들 수 있는가 (그날 기록이 아직 없을 때).
 * SPEC 4장 [확정] 2026-10-21 — 최근 7일 안의 빈 날만. 씨앗은 주고, 심는 곳은 오늘 밭.
 */
export function canCreateRecord(date: DayKey, today: DayKey): boolean {
  return canEditRecord(date, today);
}

/** 새 기록의 일한 날 / 쉬는 날 기본값: 토 · 일은 쉬는 날 (연차는 직접 고른다) */
export function defaultDayType(date: DayKey): DayType {
  const w = weekdayOf(date);
  return w === 0 || w === 6 ? 'rest' : 'work';
}

/** 기록 시트 입력값 */
export type RecordDraft = {
  dayType: DayType;
  condition: Condition | null;
  work: WorkLevel | null;
  achievement: string;
  memo: string;
  leisure: string[];
  /** 쉼 칸의 장작 크기 (쉼 칸에 적었을 때만 쓴다) */
  restSize: RestSize;
  contacts: Contact[];
};

export const emptyDraft = (dayType: DayType = 'work'): RecordDraft => ({
  dayType,
  condition: null,
  work: null,
  achievement: '',
  memo: '',
  leisure: [],
  restSize: DEFAULT_REST_SIZE,
  contacts: [],
});

export function draftFromRecord(r: DayRecord, restSize: RestSize = DEFAULT_REST_SIZE): RecordDraft {
  return {
    dayType: r.dayType,
    condition: r.condition,
    work: r.work,
    achievement: r.achievement ?? '',
    memo: r.memo ?? '',
    leisure: [...r.leisure],
    restSize,
    contacts: r.contacts.map((c) => ({ ...c })),
  };
}

/** 저장 가능한가: 컨디션은 필수, 일한 날은 일 강도도 필수. 나머지는 선택 */
export function isDraftComplete(d: RecordDraft): d is RecordDraft & { condition: Condition } {
  return d.condition !== null && (d.dayType === 'rest' || d.work !== null);
}

const clean = (s: string, max: number): string | null => {
  const t = s.trim().slice(0, max);
  return t.length ? t : null;
};

/** 입력값 → 저장할 기록. 공백 정리, 여가 중복 제거, 같은 이웃 중복 연락 제거. */
export function normalizeDraft(
  date: DayKey,
  d: RecordDraft & { condition: Condition },
  now: number,
  existing?: DayRecord | null,
): DayRecord {
  const leisure = [...new Set(d.leisure.map((l) => l.trim().slice(0, LEISURE_MAX_LENGTH)).filter(Boolean))];
  const seen = new Set<string>();
  const contacts = d.contacts.filter((c) => (seen.has(c.neighborId) ? false : (seen.add(c.neighborId), true)));
  return {
    date,
    condition: d.condition,
    dayType: d.dayType,
    work: d.work,
    achievement: clean(d.achievement, TEXT_MAX_LENGTH),
    memo: clean(d.memo, TEXT_MAX_LENGTH),
    leisure,
    contacts,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * 기록 시트 쉼 칸 → 그날의 쉼 기록(장작). 칸이 비었으면 null (이미 있던 시트 쉼 기록은 저장하면서 지운다).
 * 하루 하나(id = rec_날짜)라 다시 저장하면 덮어쓴다. 칩은 활동 태그가 된다.
 */
export function restLogOfRecord(r: DayRecord, size: RestSize, id: string, existing?: RestLog | null): RestLog | null {
  if (!r.leisure.length) return null;
  return {
    id,
    date: r.date,
    text: existing?.text ?? '',
    tags: r.leisure.map((label) => ({ kind: 'activity' as const, label })),
    size,
    createdAt: existing?.createdAt ?? r.createdAt,
  };
}

/** 기록 카드에 보일 한 줄: 메모 → 성취 → 여가 → 없음 */
export function recordHeadline(r: DayRecord): string | null {
  return r.memo ?? r.achievement ?? (r.leisure.length ? r.leisure.join(' · ') : null);
}
