import type { DayRecord } from '../types';

/** 테스트용 기록: 기본은 보통 컨디션 · 일 강도 1 · 입력 없음 */
export function rec(date: string, over: Partial<DayRecord> = {}): DayRecord {
  return {
    date,
    condition: 2,
    dayType: 'work',
    work: 1,
    memo: null,
    leisure: [],
    contacts: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

export function byDate(...records: DayRecord[]): Record<string, DayRecord> {
  return Object.fromEntries(records.map((r) => [r.date, r]));
}
