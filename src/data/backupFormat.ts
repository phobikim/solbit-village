// 백업 JSON 형식 (SPEC 10·11장: 백업은 JSON 내보내기/가져오기). SQLite에 의존하지 않는 순수 모듈.

export const BACKUP_APP = 'solbit-village';

/**
 * 백업에 담는 테이블과 열. 가져오기는 이 목록의 열만 쓴다 (모르는 열·테이블은 무시).
 * 순서 = 넣는 순서 (외래 키: day_record · neighbor → contact). 지울 때는 반대로.
 */
export const BACKUP_TABLES = {
  settings: ['key', 'value'],
  day_record: ['date', 'condition', 'day_type', 'work', 'achievement', 'memo', 'leisure', 'created_at', 'updated_at'],
  neighbor: ['id', 'name', 'face', 'color', 'relation', 'frequency', 'created_at', 'archived'],
  contact: ['id', 'date', 'neighbor_id', 'method'],
  planting: ['id', 'crop', 'record_date', 'planted_date', 'slot', 'harvested_date', 'auto_harvested'],
  inventory: ['crop', 'qty'],
  harvest_stat: ['id', 'total_harvested'],
  village_xp: ['id', 'date', 'amount', 'reason', 'at'],
  event: ['id', 'name', 'date', 'type', 'repeat_yearly', 'created_at'],
  skin: ['id', 'owned', 'equipped'],
  place: ['id', 'name', 'duration', 'visited', 'memo', 'note', 'event_id', 'log_id', 'visited_date', 'nights', 'added_date', 'created_at'],
  rest_log: ['id', 'date', 'text', 'tags', 'size', 'created_at'],
} as const;

export type BackupTable = keyof typeof BACKUP_TABLES;
export type Row = Record<string, string | number | null>;

export type Backup = {
  app: typeof BACKUP_APP;
  /** 내보낼 때의 스키마 버전 (PRAGMA user_version) */
  schemaVersion: number;
  exportedAt: string;
  tables: Partial<Record<BackupTable, Row[]>>;
};

/** 스키마 v6 전 백업의 행사 분류 → 지금 분류 (마이그레이션 v6과 같음) */
const OLD_EVENT_TYPE: Record<string, string> = { anniversary: 'birth', schedule: 'etc', etc: 'etc' };

/** 스키마 v7에서 목록에서 빠진 스킨 (마이그레이션 v7과 같음) */
const REMOVED_SKINS: readonly string[] = ['mailbox', 'jars', 'goldMega', 'sunglasses', 'knitHat'];

/**
 * 스키마 v11 전 백업에는 쉼 기록이 없다 — 마이그레이션 v11과 같이 기존 여가/쉼 기록(day_record.leisure)을
 * 그날의 쉼 기록(크기 '장작')으로 옮긴다. id는 'rec_' + 날짜.
 */
export function restLogsFromLeisure(dayRecords: readonly Row[]): Row[] {
  const out: Row[] = [];
  for (const r of dayRecords) {
    let labels: unknown;
    try {
      labels = JSON.parse(String(r.leisure ?? '[]'));
    } catch {
      continue;
    }
    if (!Array.isArray(labels)) continue;
    const tags = labels.filter((l): l is string => typeof l === 'string').map((label) => ({ kind: 'activity', label }));
    if (!tags.length) continue;
    out.push({
      id: `rec_${String(r.date)}`,
      date: String(r.date),
      text: '',
      tags: JSON.stringify(tags),
      size: 'firewood',
      created_at: typeof r.created_at === 'number' ? r.created_at : 0,
    });
  }
  return out;
}

/** 기기 안에만 남기는 설정 (가져오기로 덮지 않음): 오늘 소식을 본 날 */
export const DEVICE_ONLY_SETTINGS: readonly string[] = ['news_seen_date'];

export function buildBackup(schemaVersion: number, tables: Partial<Record<BackupTable, Row[]>>, now = new Date()): Backup {
  return { app: BACKUP_APP, schemaVersion, exportedAt: now.toISOString(), tables };
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; reason: 'notJson' | 'notOurs' | 'tooNew' | 'broken' };

const isCell = (v: unknown) => v === null || typeof v === 'string' || typeof v === 'number';

/**
 * 가져올 파일 검사. 지금 앱보다 새 버전에서 만든 백업은 받지 않는다 (모르는 열이 있을 수 있음).
 * 각 테이블은 알려진 열만 남긴다.
 */
export function parseBackup(text: string, currentSchemaVersion: number): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notJson' };
  }
  if (!raw || typeof raw !== 'object') return { ok: false, reason: 'notOurs' };
  const o = raw as Record<string, unknown>;
  if (o.app !== BACKUP_APP) return { ok: false, reason: 'notOurs' };
  if (typeof o.schemaVersion !== 'number' || !Number.isInteger(o.schemaVersion)) return { ok: false, reason: 'broken' };
  if (o.schemaVersion > currentSchemaVersion) return { ok: false, reason: 'tooNew' };
  if (!o.tables || typeof o.tables !== 'object') return { ok: false, reason: 'broken' };

  const tables: Partial<Record<BackupTable, Row[]>> = {};
  const src = o.tables as Record<string, unknown>;
  for (const name of Object.keys(BACKUP_TABLES) as BackupTable[]) {
    const rows = src[name];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) return { ok: false, reason: 'broken' };
    const cols: readonly string[] = BACKUP_TABLES[name];
    const clean: Row[] = [];
    for (const r of rows) {
      if (!r || typeof r !== 'object') return { ok: false, reason: 'broken' };
      const row: Row = {};
      for (const c of cols) {
        const v = (r as Record<string, unknown>)[c];
        if (v === undefined) continue;
        if (!isCell(v)) return { ok: false, reason: 'broken' };
        row[c] = v as string | number | null;
      }
      clean.push(row);
    }
    if (name === 'event' && o.schemaVersion < 6) {
      for (const r of clean) r.type = OLD_EVENT_TYPE[String(r.type)] ?? 'etc';
    }
    if (name === 'skin' && o.schemaVersion < 7) {
      tables[name] = clean.filter((r) => !REMOVED_SKINS.includes(String(r.id)));
      continue;
    }
    tables[name] = name === 'settings' ?clean.filter((r) => !DEVICE_ONLY_SETTINGS.includes(String(r.key))) : clean;
  }
  if (o.schemaVersion < 11 && tables.rest_log === undefined && tables.day_record) {
    tables.rest_log = restLogsFromLeisure(tables.day_record);
  }
  return {
    ok: true,
    backup: { app: BACKUP_APP, schemaVersion: o.schemaVersion, exportedAt: String(o.exportedAt ?? ''), tables },
  };
}

/** 파일 이름: solbit-backup-2026-10-21.json */
export function backupFileName(day: string): string {
  return `solbit-backup-${day}.json`;
}
