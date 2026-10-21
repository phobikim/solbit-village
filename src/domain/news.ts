// 밤사이 마을 소식 (SPEC 10장). 그날 처음 앱을 열면 보여준다.
// 기록이 없던 날에도 소식은 온다. 벌·경고성 소식은 만들지 않는다 (CLAUDE.md 규칙 4).

import { stageOf, type Planting } from './crops';
import { addDays, daysBetween, type DayKey } from './day';
import type { VillageEvent } from './events';
import type { CropKind } from './types';

/** 며칠 안의 행사까지 소식에 넣을지 */
export const NEWS_EVENT_LOOKAHEAD_DAYS = 3;

export type NewsItem =
  /** 밤사이 다 익은 작물 */
  | { kind: 'ripened'; crops: CropKind[] }
  /** 밤사이 한 단계 자란 작물 (새싹 → 자라는 중) */
  | { kind: 'grew'; crops: CropKind[] }
  /** 어제 연락한 이웃이 놀러 와 있음 */
  | { kind: 'visitors'; names: string[] }
  | { kind: 'eventToday'; name: string }
  | { kind: 'eventSoon'; name: string; days: number }
  /** 아무 일도 없던 날 */
  | { kind: 'quiet' };

export type NewsInput = {
  today: DayKey;
  /** 밭에 있는 작물 */
  active: readonly Planting[];
  /** 어제 연락해서 오늘 마을에 와 있는 이웃 이름 */
  visitors: readonly string[];
  events: readonly VillageEvent[];
};

export function morningNews({ today, active, visitors, events }: NewsInput): NewsItem[] {
  const yesterday = addDays(today, -1);
  const items: NewsItem[] = [];

  const ripened: CropKind[] = [];
  const grew: CropKind[] = [];
  for (const p of active) {
    // 오늘 심은 작물은 밤사이 일이 아니다
    if (daysBetween(p.plantedDate, today) < 1) continue;
    const before = stageOf(p.plantedDate, yesterday);
    const now = stageOf(p.plantedDate, today);
    if (now === 3 && before === 2) ripened.push(p.crop);
    else if (now === 2 && before === 1) grew.push(p.crop);
  }
  if (ripened.length) items.push({ kind: 'ripened', crops: ripened });
  if (grew.length) items.push({ kind: 'grew', crops: grew });
  if (visitors.length) items.push({ kind: 'visitors', names: [...visitors] });

  for (const e of [...events].sort((a, b) => a.date.localeCompare(b.date))) {
    const d = daysBetween(today, e.date);
    if (d === 0) items.push({ kind: 'eventToday', name: e.name });
    else if (d > 0 && d <= NEWS_EVENT_LOOKAHEAD_DAYS) items.push({ kind: 'eventSoon', name: e.name, days: d });
  }

  return items.length ? items : [{ kind: 'quiet' }];
}

/** 오늘 소식을 이미 봤는가 */
export function shouldShowNews(lastSeen: DayKey | null, today: DayKey): boolean {
  return lastSeen !== today;
}

// ── 아침 알림 시각 (설정에서 바꾼다) ────────────────────────────────────

/** 처음 설치했을 때의 알림 시각. 설정에서 바꿀 수 있다. */
export const DEFAULT_NEWS_ALARM = '08:00';
/** 알림 시각 바꾸는 단위 (분) */
export const NEWS_ALARM_STEP_MIN = 30;

export function parseAlarmTime(s: string | null): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s ?? '');
  const h = m ? Number(m[1]) : NaN;
  const min = m ? Number(m[2]) : NaN;
  if (!m || h > 23 || min > 59) return parseAlarmTime(DEFAULT_NEWS_ALARM);
  return { hour: h, minute: min };
}

export function formatAlarmTime(t: { hour: number; minute: number }): string {
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

/** 알림 시각을 step분 앞뒤로 (하루를 넘어가면 돈다) */
export function shiftAlarmTime(t: { hour: number; minute: number }, deltaMin: number): { hour: number; minute: number } {
  const total = (((t.hour * 60 + t.minute + deltaMin) % 1440) + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}
