// 하루 기록 규칙 (SPEC 4장).

import { daysBetween, type DayKey } from './day';
import type { Condition, Contact, DayRecord, WorkLevel } from './types';

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

/** 기록 시트 입력값 */
export type RecordDraft = {
  condition: Condition | null;
  work: WorkLevel | null;
  achievement: string;
  memo: string;
  leisure: string[];
  contacts: Contact[];
};

export const emptyDraft = (): RecordDraft => ({
  condition: null,
  work: null,
  achievement: '',
  memo: '',
  leisure: [],
  contacts: [],
});

export function draftFromRecord(r: DayRecord): RecordDraft {
  return {
    condition: r.condition,
    work: r.work,
    achievement: r.achievement ?? '',
    memo: r.memo ?? '',
    leisure: [...r.leisure],
    contacts: r.contacts.map((c) => ({ ...c })),
  };
}

/** 저장 가능한가: 컨디션과 일 강도는 필수, 나머지는 선택 */
export function isDraftComplete(d: RecordDraft): d is RecordDraft & { condition: Condition; work: WorkLevel } {
  return d.condition !== null && d.work !== null;
}

const clean = (s: string, max: number): string | null => {
  const t = s.trim().slice(0, max);
  return t.length ? t : null;
};

/** 입력값 → 저장할 기록. 공백 정리, 여가 중복 제거, 같은 이웃 중복 연락 제거. */
export function normalizeDraft(
  date: DayKey,
  d: RecordDraft & { condition: Condition; work: WorkLevel },
  now: number,
  existing?: DayRecord | null,
): DayRecord {
  const leisure = [...new Set(d.leisure.map((l) => l.trim().slice(0, LEISURE_MAX_LENGTH)).filter(Boolean))];
  const seen = new Set<string>();
  const contacts = d.contacts.filter((c) => (seen.has(c.neighborId) ? false : (seen.add(c.neighborId), true)));
  return {
    date,
    condition: d.condition,
    work: d.work,
    achievement: clean(d.achievement, TEXT_MAX_LENGTH),
    memo: clean(d.memo, TEXT_MAX_LENGTH),
    leisure,
    contacts,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** 기록 카드에 보일 한 줄: 메모 → 성취 → 여가 → 없음 */
export function recordHeadline(r: DayRecord): string | null {
  return r.memo ?? r.achievement ?? (r.leisure.length ? r.leisure.join(' · ') : null);
}
