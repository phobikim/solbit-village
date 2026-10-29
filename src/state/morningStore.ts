// 아침 흐름에서 고른 값. 메모리에만 둔다 (DB 저장 없음 — 저장 모델은 미정, src/domain/morning.ts의 TODO).
// 하루 종류만 가진다. 컨디션은 아침 흐름에서 묻지 않는다. 고른 날(04:00 하루 경계)이 지나면 "안 골랐다"로 돌아간다.

import { create } from 'zustand';

import { today, type DayKey } from '../domain/day';
import { normalizeDayType, type DayType } from '../domain/morning';

type MorningState = {
  dayType: DayType | null;
  /** dayType을 고른 "하루" */
  pickedOn: DayKey | null;
  /** 모르는 값(예전의 'rest' 등)이 오면 "아직 안 골랐다"로 보정한다 */
  setDayType: (d: DayType | null, now?: Date) => void;
  reset: () => void;
};

export const useMorning = create<MorningState>((set) => ({
  dayType: null,
  pickedOn: null,
  setDayType: (d, now = new Date()) => {
    const dayType = normalizeDayType(d);
    set({ dayType, pickedOn: dayType === null ? null : today(now) });
  },
  reset: () => set({ dayType: null, pickedOn: null }),
}));

/** 오늘(04:00 경계) 고른 하루 종류. 어제 고른 값이면 null. */
export function useTodayDayType(now: Date): DayType | null {
  return useMorning((s) => (s.pickedOn === today(now) ? s.dayType : null));
}
