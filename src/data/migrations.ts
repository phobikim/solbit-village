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

  // v6 — 디자인 v5 TURN 11 마을 게시판: 행사 분류 5종 + 매년 반복.
  //      예전 분류는 기념일 → 생일·기념일, 일정 · 기타 → 기타로 옮긴다 (CHECK가 바뀌어 테이블을 다시 만든다).
  `
  CREATE TABLE event_v6 (
    id            TEXT PRIMARY KEY NOT NULL,
    name          TEXT NOT NULL,
    date          TEXT NOT NULL,                      -- 처음 날짜 (매년 반복이면 월·일만 씀)
    type          TEXT NOT NULL CHECK (type IN ('travel', 'birth', 'work', 'meet', 'etc')),
    repeat_yearly INTEGER NOT NULL DEFAULT 0,
    created_at    INTEGER NOT NULL
  );
  INSERT INTO event_v6 (id, name, date, type, repeat_yearly, created_at)
    SELECT id, name, date, CASE type WHEN 'anniversary' THEN 'birth' ELSE 'etc' END, 0, created_at FROM event;
  DROP TABLE event;
  ALTER TABLE event_v6 RENAME TO event;
  CREATE INDEX event_date ON event(date);
  `,

  // v7 — 디자인 v5 교환소 개정: 목록에서 빠진 스킨을 보유 스킨에서도 지운다 (2026-10-22 사용자 결정)
  `
  DELETE FROM skin WHERE id IN ('mailbox', 'jars', 'goldMega', 'sunglasses', 'knitHat');
  `,

  // v8 — 디자인 v6 쉼터: 보따리 (가고 싶은 곳 · 다녀온 곳)
  `
  CREATE TABLE place (
    id           TEXT PRIMARY KEY NOT NULL,
    name         TEXT NOT NULL,
    duration     TEXT NOT NULL CHECK (duration IN ('short', 'half', 'weekend')),
    visited      INTEGER NOT NULL DEFAULT 0,
    event_id     TEXT,                                  -- '날짜 잡기'로 만든 여행 행사
    visited_date TEXT,                                  -- 다녀온 곳: 출발한 날
    nights       INTEGER NOT NULL DEFAULT 0,            -- 다녀온 곳: 몇 박 (0 = 당일치기)
    added_date   TEXT NOT NULL,
    created_at   INTEGER NOT NULL
  );
  `,

  // v9 — 쉼터 정리 (2026-10-23): 가고 싶은 곳 메모 · 다녀온 곳 한 줄 소감
  `
  ALTER TABLE place ADD COLUMN memo TEXT;
  ALTER TABLE place ADD COLUMN note TEXT;
  `,

  // v10 — 디자인 v7 TURN 14: 일한 날 / 쉬는 날. 쉬는 날은 일 강도를 비워 둘 수 있다 (work NULL 허용).
  //       NOT NULL을 풀려면 day_record를 다시 만들어야 한다. contact가 day_record를 ON DELETE CASCADE로 보고 있어서
  //       그냥 지우면 연락 기록이 같이 지워지므로, contact를 먼저 옮겨 두고 다시 만든 뒤 되돌린다.
  //       예전 기록은 모두 일한 날.
  `
  CREATE TABLE contact_v10 AS SELECT id, date, neighbor_id, method FROM contact;
  DROP TABLE contact;

  CREATE TABLE day_record_v10 (
    date        TEXT PRIMARY KEY NOT NULL,
    condition   INTEGER NOT NULL CHECK (condition BETWEEN 1 AND 3),
    day_type    TEXT NOT NULL DEFAULT 'work' CHECK (day_type IN ('work', 'rest')),
    work        INTEGER CHECK (work BETWEEN 1 AND 3),
    achievement TEXT,
    memo        TEXT,
    leisure     TEXT NOT NULL DEFAULT '[]',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    CHECK (day_type = 'rest' OR work IS NOT NULL)
  );
  INSERT INTO day_record_v10 (date, condition, day_type, work, achievement, memo, leisure, created_at, updated_at)
    SELECT date, condition, 'work', work, achievement, memo, leisure, created_at, updated_at FROM day_record;
  DROP TABLE day_record;
  ALTER TABLE day_record_v10 RENAME TO day_record;

  CREATE TABLE contact (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL REFERENCES day_record(date) ON DELETE CASCADE,
    neighbor_id TEXT NOT NULL REFERENCES neighbor(id),
    method      TEXT NOT NULL CHECK (method IN ('call', 'meet', 'message')),
    UNIQUE (date, neighbor_id)
  );
  INSERT INTO contact (id, date, neighbor_id, method) SELECT id, date, neighbor_id, method FROM contact_v10;
  DROP TABLE contact_v10;
  CREATE INDEX contact_neighbor ON contact(neighbor_id, date);
  `,
  // v11 — 디자인 v8 TURN 15 쉼터(모닥불): 쉼 기록 테이블 하나로 통합 (날짜 · 한 줄 · 태그들 · 크기).
  //       기록 시트의 쉼 칸과 '장작 던지기'가 같은 테이블에 저장한다.
  //       기존 여가/쉼 기록(day_record.leisure)은 그날의 쉼 기록으로 옮기고 크기는 '장작'으로 둔다.
  //       (leisure 열은 기록 시트 · 작물 결정이 계속 쓰므로 남긴다. 기록 시트 쉼 기록 id = 'rec_' + 날짜)
  //       place.log_id: 장작 던지기에서 찍은 발자국이 어느 쉼 기록에서 왔는지.
  `
  CREATE TABLE rest_log (
    id         TEXT PRIMARY KEY NOT NULL,
    date       TEXT NOT NULL,
    text       TEXT NOT NULL DEFAULT '',
    tags       TEXT NOT NULL DEFAULT '[]',            -- JSON: [{kind, label, ref?}]
    size       TEXT NOT NULL CHECK (size IN ('twig', 'firewood', 'log')),
    created_at INTEGER NOT NULL
  );
  CREATE INDEX rest_log_date ON rest_log(date);

  INSERT INTO rest_log (id, date, text, tags, size, created_at)
    SELECT 'rec_' || date, date, '',
           (SELECT json_group_array(json_object('kind', 'activity', 'label', value)) FROM json_each(day_record.leisure)),
           'firewood', created_at
      FROM day_record
     WHERE leisure <> '[]' AND json_valid(leisure) AND json_array_length(leisure) > 0;

  ALTER TABLE place ADD COLUMN log_id TEXT;
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;
