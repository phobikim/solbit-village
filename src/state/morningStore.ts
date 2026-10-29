// 아침 흐름에서 고른 값. 메모리에만 둔다 (DB 저장 없음 — 저장 모델은 미정, src/domain/morning.ts의 TODO ③).

import { create } from 'zustand';

import type { DayType, MorningCondition } from '../domain/morning';

type MorningState = {
  dayType: DayType | null;
  condition: MorningCondition | null;
  setDayType: (d: DayType) => void;
  setCondition: (c: MorningCondition) => void;
  reset: () => void;
};

export const useMorning = create<MorningState>((set) => ({
  dayType: null,
  condition: null,
  setDayType: (dayType) => set({ dayType }),
  setCondition: (condition) => set({ condition }),
  reset: () => set({ dayType: null, condition: null }),
}));
