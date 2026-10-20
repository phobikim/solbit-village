// "하루"의 경계와 날짜 계산. 앱의 모든 날짜 계산은 이 파일을 거친다 (CLAUDE.md).
// 날짜는 'YYYY-MM-DD' 문자열(DayKey)로 다룬다. 내부 계산은 UTC로 해서 서머타임 영향을 받지 않는다.

/**
 * 하루가 바뀌는 시각 (기기 현지 시각, 시).
 * TODO: SPEC 4장 [미정] — 자정(0)인지, 새벽 4시 같은 늦은 기준인지 사용자 결정 필요. 임시로 자정.
 */
export const DAY_BOUNDARY_HOUR = 0;

/** 'YYYY-MM-DD' */
export type DayKey = string;

export type YearMonth = { year: number; month: number /* 1-12 */ };

const pad = (n: number) => String(n).padStart(2, '0');

function fromUtc(d: Date): DayKey {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toUtc(key: DayKey): Date {
  const { year, month, day } = parseDayKey(key);
  return new Date(Date.UTC(year, month - 1, day));
}

export function makeDayKey(year: number, month: number, day: number): DayKey {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseDayKey(key: DayKey): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`잘못된 날짜 키: ${key}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** 시각 → 그 시각이 속한 "하루". 경계 시각 전이면 전날로 친다. */
export function dayKeyOf(at: Date, boundaryHour: number = DAY_BOUNDARY_HOUR): DayKey {
  const shifted = new Date(at.getTime() - boundaryHour * 60 * 60 * 1000);
  return makeDayKey(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate());
}

export function today(now: Date = new Date()): DayKey {
  return dayKeyOf(now);
}

export function addDays(key: DayKey, n: number): DayKey {
  const d = toUtc(key);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

/** b - a (일) */
export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

/** 0 = 일요일 … 6 = 토요일 */
export function weekdayOf(key: DayKey): number {
  return toUtc(key).getUTCDay();
}

export function yearMonthOf(key: DayKey): YearMonth {
  const { year, month } = parseDayKey(key);
  return { year, month };
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const idx = ym.year * 12 + (ym.month - 1) + n;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function daysInMonth(ym: YearMonth): number {
  return new Date(Date.UTC(ym.year, ym.month, 0)).getUTCDate();
}

/**
 * 달력 칸 (일요일 시작). 앞뒤 빈칸은 null, 길이는 7의 배수.
 */
export function monthGrid(ym: YearMonth): (DayKey | null)[] {
  const first = makeDayKey(ym.year, ym.month, 1);
  const lead = weekdayOf(first);
  const n = daysInMonth(ym);
  const cells: (DayKey | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= n; d++) cells.push(makeDayKey(ym.year, ym.month, d));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** 'D-7', 'D-DAY', 'D+3' */
export function dDayLabel(target: DayKey, from: DayKey): string {
  const diff = daysBetween(from, target);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}
