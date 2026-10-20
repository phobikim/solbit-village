import {
  addDays,
  addMonths,
  daysBetween,
  dayKeyOf,
  daysInMonth,
  dDayLabel,
  makeDayKey,
  monthGrid,
  parseDayKey,
  weekdayOf,
} from '../day';

describe('dayKeyOf', () => {
  it('자정 기준이면 그날', () => {
    expect(dayKeyOf(new Date(2026, 9, 20, 0, 30), 0)).toBe('2026-10-20');
    expect(dayKeyOf(new Date(2026, 9, 20, 23, 59), 0)).toBe('2026-10-20');
  });

  it('경계 시각 전이면 전날로 친다', () => {
    expect(dayKeyOf(new Date(2026, 9, 20, 3, 59), 4)).toBe('2026-10-19');
    expect(dayKeyOf(new Date(2026, 9, 20, 4, 0), 4)).toBe('2026-10-20');
  });

  it('월·연 경계도 넘어간다', () => {
    expect(dayKeyOf(new Date(2027, 0, 1, 2, 0), 4)).toBe('2026-12-31');
  });
});

describe('날짜 연산', () => {
  it('addDays는 월·연·윤년을 넘는다', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('daysBetween', () => {
    expect(daysBetween('2026-10-20', '2026-10-27')).toBe(7);
    expect(daysBetween('2026-10-27', '2026-10-20')).toBe(-7);
  });

  it('weekdayOf: 2026-10-01은 목요일, 2026-10-20은 화요일', () => {
    expect(weekdayOf('2026-10-01')).toBe(4);
    expect(weekdayOf('2026-10-20')).toBe(2);
  });

  it('addMonths는 연도를 넘는다', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('daysInMonth', () => {
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28);
    expect(daysInMonth({ year: 2028, month: 2 })).toBe(29);
    expect(daysInMonth({ year: 2026, month: 10 })).toBe(31);
  });

  it('parse / make 왕복', () => {
    expect(parseDayKey(makeDayKey(2026, 1, 5))).toEqual({ year: 2026, month: 1, day: 5 });
    expect(() => parseDayKey('2026-1-5')).toThrow();
  });
});

describe('monthGrid', () => {
  it('일요일 시작, 앞 빈칸, 7의 배수', () => {
    const g = monthGrid({ year: 2026, month: 10 });
    expect(g.slice(0, 4)).toEqual([null, null, null, null]);
    expect(g[4]).toBe('2026-10-01');
    expect(g.length % 7).toBe(0);
    expect(g.filter(Boolean)).toHaveLength(31);
  });
});

describe('dDayLabel', () => {
  it('앞으로 / 당일 / 지난', () => {
    expect(dDayLabel('2026-10-27', '2026-10-20')).toBe('D-7');
    expect(dDayLabel('2026-10-20', '2026-10-20')).toBe('D-DAY');
    expect(dDayLabel('2026-10-18', '2026-10-20')).toBe('D+2');
  });
});
