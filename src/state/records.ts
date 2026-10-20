// 하루 기록 스토어. 화면은 여기서 읽고, 저장은 save()로만 한다.

import { create } from 'zustand';

import { getDayRecord, listDayRecords, saveDayRecord } from '../data/records';
import { addDays, daysInMonth, makeDayKey, type DayKey, type YearMonth } from '../domain/day';
import type { DayRecord } from '../domain/types';
import { WEATHER_WINDOW_DAYS } from '../domain/weather';

type State = {
  byDate: Record<DayKey, DayRecord>;
  /** 'YYYY-MM' 읽어 둔 달 */
  loadedMonths: Record<string, true>;
  loadMonth: (ym: YearMonth, force?: boolean) => Promise<void>;
  loadDay: (date: DayKey) => Promise<DayRecord | null>;
  save: (r: DayRecord) => Promise<void>;
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
    const to = makeDayKey(ym.year, ym.month, daysInMonth(ym));
    const rows = await listDayRecords(from, to);
    set((s) => ({
      byDate: { ...s.byDate, ...Object.fromEntries(rows.map((r) => [r.date, r])) },
      loadedMonths: { ...s.loadedMonths, [id]: true },
    }));
  },

  async loadDay(date) {
    const r = await getDayRecord(date);
    if (r) set((s) => ({ byDate: { ...s.byDate, [date]: r } }));
    return r;
  },

  async save(r) {
    await saveDayRecord(r);
    set((s) => ({ byDate: { ...s.byDate, [r.date]: r } }));
  },
}));
