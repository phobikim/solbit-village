// SQLite 연결. 스키마·마이그레이션은 단계 3에서 추가한다.
// 웹에서는 expo-sqlite가 wa-sqlite(wasm) + OPFS를 쓴다 → metro.config.js의 wasm 설정 필요.
// 웹에서 동기 API(openDatabaseSync, runSync …)는 SharedArrayBuffer(교차 출처 격리)가 필요하므로
// 이 앱은 비동기 API만 쓴다.

import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'solbit.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

/** 앱 시작 시 한 번. DB가 열리는지만 확인한다 (스키마는 단계 3). */
export async function initDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL;');
}
