// 백업 내보내기 / 가져오기 (SQLite ↔ JSON 문자열). 파일 저장·공유는 화면 쪽에서 플랫폼별로 한다.

import { buildBackup, BACKUP_TABLES, ENSURE_ROWS_SQL, parseBackup, type BackupTable, type ParseResult, type Row } from './backupFormat';
import { getDb, writeTx } from './db';
import { SCHEMA_VERSION } from './migrations';

/** 모든 테이블을 JSON 문자열로 */
export async function exportBackupJson(now = new Date()): Promise<string> {
  const db = await getDb();
  const tables: Partial<Record<BackupTable, Row[]>> = {};
  for (const [name, cols] of Object.entries(BACKUP_TABLES) as [BackupTable, readonly string[]][]) {
    tables[name] = await db.getAllAsync<Row>(`SELECT ${cols.join(', ')} FROM ${name}`);
  }
  return JSON.stringify(buildBackup(SCHEMA_VERSION, tables, now), null, 2);
}

export function checkBackup(text: string): ParseResult {
  return parseBackup(text, SCHEMA_VERSION);
}

/**
 * 백업으로 지금 데이터를 통째로 바꾼다 (한 트랜잭션, 실패하면 그대로).
 * 백업에 없는 테이블은 비운다. 이 기기에서 오늘 소식을 본 날은 남긴다.
 */
export async function restoreBackup(text: string): Promise<ParseResult> {
  const parsed = checkBackup(text);
  if (!parsed.ok) return parsed;
  const names = Object.keys(BACKUP_TABLES) as BackupTable[];
  await writeTx(async (db) => {
    for (const name of [...names].reverse()) {
      if (name === 'settings') await db.runAsync("DELETE FROM settings WHERE key <> 'news_seen_date'");
      else await db.runAsync(`DELETE FROM ${name}`);
    }
    for (const name of names) {
      for (const row of parsed.backup.tables[name] ?? []) {
        // 열 이름은 BACKUP_TABLES 목록에서만 온다 (parseBackup이 걸러냄)
        const cols = Object.keys(row);
        if (!cols.length) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO ${name} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          cols.map((c) => row[c]),
        );
      }
    }
    // 수확 통계 · 재화 행은 항상 하나 있어야 한다
    for (const sql of ENSURE_ROWS_SQL) await db.runAsync(sql);
  });
  return parsed;
}
