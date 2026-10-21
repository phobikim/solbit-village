// 하루 기록 스토어. 화면은 여기서 읽고, 저장은 save()로만 한다.

import { create } from 'zustand';

import { commitDayRecord, type CommitResult } from '../data/farm';
import { getDayRecord, listDayRecords } from '../data/records';
import { addDays, daysInMonth, makeDayKey, today as getToday, type DayKey, type YearMonth } from '../domain/day';
import type { DayRecord } from '../domain/types';
import { WEATHER_WINDOW_DAYS } from '../domain/weather';
import { useFarm } from './farm';

type State = {
  byDate: Record<DayKey, DayRecord>;
  /** 'YYYY-MM' 읽어 둔 달 */
  loadedMonths: Record<string, true>;
  loadMonth: (ym: YearMonth, force?: boolean) => Promise<void>;
  /** from ~ to 기록 읽기 (마을 화면: 지수·날씨·이웃 방문 계산용) */
  loadRange: (from: DayKey, to: DayKey) => Promise<void>;
  loadDay: (date: DayKey) => Promise<DayRecord | null>;
  /** 기록 저장 + (오늘 처음이면) 씨앗 심기 + 경험치. 결과로 씨앗 결과 화면을 띄운다. */
  save: (r: DayRecord) => Promise<CommitResult>;
  /** 백업을 가져온 뒤 등: 읽어 둔 기록을 비운다 */
  reset: () => void;
};

const monthId = (ym: YearMonth) => `${ym.year}-${String(ym.month).padStart(2, '0')}`;

export const useRecords = create<State>((set, get) => ({
  byDate: {},
  loadedMonths: {},

  async loadMonth(ym, force = false) {
    const id = monthId(ym);
    if (!force && get().loadedMonths[id]) return;
    // 달 첫날 날씨 계산용으로 앞의 며칠도 함께 읽는다
    const from = addDays(makeDayKey(ym.year, ym.month, 1), -(WEATHER_WINDOW_DAYS - 1));
    await get().loadRange(from, makeDayKey(ym.year, ym.month, daysInMonth(ym)));
    set((s) => ({ loadedMonths: { ...s.loadedMonths, [id]: true } }));
  },

  async loadRange(from, to) {
    const rows = await listDayRecords(from, to);
    set((s) => ({ byDate: { ...s.byDate, ...Object.fromEntries(rows.map((r) => [r.date, r])) } }));
  },

  async loadDay(date) {
    const r = await getDayRecord(date);
    if (r) set((s) => ({ byDate: { ...s.byDate, [date]: r } }));
    return r;
  },

  reset() {
    set({ byDate: {}, loadedMonths: {} });
  },

  async save(r) {
    const result = await commitDayRecord(r, getToday());
    set((s) => ({ byDate: { ...s.byDate, [r.date]: r } }));
    await useFarm.getState().load();
    return result;
  },
}));
