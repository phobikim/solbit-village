// 설정 저장소 (settings 테이블: key · value 문자열)

import { getDb, writeTx } from './db';

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): Promise<void> {
  return writeTx(async (db) => {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  });
}

export const SETTING = {
  /** 오늘 소식을 본 날 (YYYY-MM-DD, 이 기기에만) */
  newsSeenDate: 'news_seen_date',
  /** 아침 알림 켬 '1' / 끔 '0' */
  newsAlarmOn: 'news_alarm_on',
  /** 아침 알림 시각 'HH:MM' */
  newsAlarmTime: 'news_alarm_time',
  /** 아침 흐름을 마친 날 (YYYY-MM-DD). 아직 쓰는 곳 없음 — 컨디션 이후 화면과 함께 만든다. 지금은 읽기만. */
  morningDoneDay: 'morning_done_day',
  /** 쪽지 제안 기억 (JSON: 장소별 마지막 제안일 · 오늘의 쪽지) */
  restNote: 'rest_note',
} as const;
