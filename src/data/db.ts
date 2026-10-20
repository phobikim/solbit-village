// SQLite 연결과 마이그레이션.
// 웹에서는 expo-sqlite가 wa-sqlite(wasm) + OPFS를 쓴다 → metro.config.js의 wasm 설정 필요.
// 웹에서 동기 API(openDatabaseSync, runSync …)는 SharedArrayBuffer(교차 출처 격리)가 필요하므로
// 이 앱은 비동기 API만 쓴다.

import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from './migrations';

export const DB_NAME = 'solbit.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);
  return db;
}

/** 열린 DB (첫 호출 때 열고 마이그레이션까지 끝낸다) */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}

let writeQueue: Promise<unknown> = Promise.resolve();

/**
 * 쓰기 트랜잭션. 웹은 withExclusiveTransactionAsync를 지원하지 않아 withTransactionAsync를 쓰는데,
 * 이 방식은 다른 비동기 쿼리가 트랜잭션 중간에 끼어들 수 있으므로 쓰기를 한 줄로 세운다.
 */
export function writeTx(task: (db: SQLite.SQLiteDatabase) => Promise<void>): Promise<void> {
  const run = writeQueue.then(async () => {
    const db = await getDb();
    await db.withTransactionAsync(() => task(db));
  });
  writeQueue = run.catch(() => {});
  return run;
}

/** 앱 시작 시 한 번. */
export async function initDb(): Promise<void> {
  await getDb();
}
