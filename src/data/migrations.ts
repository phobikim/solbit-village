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

  // v2 — 단계 4: 밭 · 창고 · 수확 통계 · 마을 경험치
  `
  CREATE TABLE planting (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    crop           TEXT NOT NULL CHECK (crop IN ('sunflower', 'strawberry', 'coffee', 'mushroom', 'potato')),
    planted_date   TEXT NOT NULL UNIQUE,              -- 하루 기록 1번 = 씨앗 1개
    slot           INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 4),
    harvested_date TEXT,                              -- NULL이면 밭에 있음
    auto_harvested INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX planting_active ON planting(harvested_date);

  CREATE TABLE inventory (
    crop TEXT PRIMARY KEY NOT NULL,
    qty  INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0)  -- 교환으로 줄 수 있음
  );

  CREATE TABLE harvest_stat (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    total_harvested INTEGER NOT NULL DEFAULT 0        -- 수확 레벨용, 줄지 않음
  );
  INSERT INTO harvest_stat (id, total_harvested) VALUES (1, 0);

  CREATE TABLE village_xp (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    date   TEXT NOT NULL,                             -- 어느 날 기록으로 받은 경험치인지
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    at     INTEGER NOT NULL                           -- 받은 시각 (레벨업한 날 판단용)
  );
  CREATE INDEX village_xp_date ON village_xp(date);
  `,

  // v3 — 단계 5: 행사(이장네 장부) · 스킨
  `
  CREATE TABLE event (
    id         TEXT PRIMARY KEY NOT NULL,
    name       TEXT NOT NULL,
    date       TEXT NOT NULL,                         -- YYYY-MM-DD
    type       TEXT NOT NULL CHECK (type IN ('anniversary', 'schedule', 'etc')),
    created_at INTEGER NOT NULL
  );
  CREATE INDEX event_date ON event(date);

  CREATE TABLE skin (
    id       TEXT PRIMARY KEY NOT NULL,
    owned    INTEGER NOT NULL DEFAULT 0,
    equipped INTEGER NOT NULL DEFAULT 0
  );
  `,

  // v4 — 지난날 빈칸 기록: 씨앗은 기록한 날(record_date)당 1개, 심는 날(planted_date)은 오늘.
  //      record_date NULL은 개발 도구로 채운 작물.
  `
  CREATE TABLE planting_v4 (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    crop           TEXT NOT NULL CHECK (crop IN ('sunflower', 'strawberry', 'coffee', 'mushroom', 'potato')),
    record_date    TEXT UNIQUE,                       -- 하루 기록 1번 = 씨앗 1개
    planted_date   TEXT NOT NULL,                     -- 성장은 이 날부터
    slot           INTEGER NOT NULL CHECK (slot BETWEEN 0 AND 4),
    harvested_date TEXT,
    auto_harvested INTEGER NOT NULL DEFAULT 0
  );
  INSERT INTO planting_v4 (id, crop, record_date, planted_date, slot, harvested_date, auto_harvested)
    SELECT id, crop, planted_date, planted_date, slot, harvested_date, auto_harvested FROM planting;
  DROP TABLE planting;
  ALTER TABLE planting_v4 RENAME TO planting;
  CREATE INDEX planting_active ON planting(harvested_date);
  `,

  // v5 — 디자인 v5 개정: 솔이 스킨 커피 앞치마 · 버섯 우산을 목록과 보유 스킨에서 뺀다 (2026-10-21 사용자 결정)
  `
  DELETE FROM skin WHERE id IN ('apron', 'mush');
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;
