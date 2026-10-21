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
} as const;
