// SQLite 마이그레이션. PRAGMA user_version으로 적용 단계를 기록한다.
// 한 번 배포한 마이그레이션은 고치지 말고 새 항목을 뒤에 추가한다.
// 스키마는 SPEC 12장 [제안] 기준. 작물·창고·경험치 등은 해당 단계에서 추가한다.

export const MIGRATIONS: readonly string[] = [
  // v1 — 단계 3: 하루 기록 · 연락 · 이웃 · 설정
  `
  CREATE TABLE day_record (
    date        TEXT PRIMARY KEY NOT NULL,           -- day.ts 기준 YYYY-MM-DD
    condition   INTEGER NOT NULL CHECK (condition BETWEEN 1 AND 3),
    work        INTEGER NOT NULL CHECK (work BETWEEN 1 AND 3),
    achievement TEXT,
    memo        TEXT,
    leisure     TEXT NOT NULL DEFAULT '[]',          -- JSON 문자열 배열
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE neighbor (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    face        INTEGER NOT NULL CHECK (face BETWEEN 0 AND 11),
    color       INTEGER NOT NULL CHECK (color BETWEEN 0 AND 5),
    relation    TEXT NOT NULL CHECK (relation IN ('family', 'friend', 'coworker', 'etc')),
    frequency   TEXT NOT NULL CHECK (frequency IN ('often', 'sometimes', 'rarely')),
    created_at  INTEGER NOT NULL,
    archived    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE contact (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL REFERENCES day_record(date) ON DELETE CASCADE,
    neighbor_id TEXT NOT NULL REFERENCES neighbor(id),
    method      TEXT NOT NULL CHECK (method IN ('call', 'meet', 'message')),
    UNIQUE (date, neighbor_id)
  );
  CREATE INDEX contact_neighbor ON contact(neighbor_id, date);

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;
