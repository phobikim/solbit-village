// 밭 · 창고 · 경험치 저장소, 그리고 "기록 저장 + 씨앗 심기 + 경험치"를 한 트랜잭션으로 묶는 함수.
// 어떤 작물을 어디에 심을지는 src/domain이 정하고, 여기서는 그대로 쓴다.

import type { SQLiteDatabase } from 'expo-sqlite';

import { cropFor, dueForAutoHarvest, planSeed, type Planting } from '../domain/crops';
import { canEditRecord } from '../domain/records';
import { dayKeyOf, type DayKey } from '../domain/day';
import type { CropKind, DayRecord } from '../domain/types';
import { xpDelta, xpForRecord } from '../domain/village';
import { getDb, writeTx } from './db';
import { saveDayRecordTx } from './records';

type PlantingRow = { id: number; crop: CropKind; planted_date: string; slot: number };

const toPlanting = (r: PlantingRow): Planting => ({ id: r.id, crop: r.crop, plantedDate: r.planted_date, slot: r.slot });

async function activePlantingsOn(db: SQLiteDatabase): Promise<Planting[]> {
  const rows = await db.getAllAsync<PlantingRow>(
    'SELECT id, crop, planted_date, slot FROM planting WHERE harvested_date IS NULL ORDER BY planted_date',
  );
  return rows.map(toPlanting);
}

/**
 * planting.auto_harvested 값: 어떻게 수확됐는지.
 * 0 = 예전 직접 수확(지금은 없음), 1 = 밭이 꽉 차서 가장 오래된 작물을 대신 땀, 2 = 다 자라서 자동 수확
 */
export const HARVEST_KIND = { legacyManual: 0, fieldFull: 1, matured: 2 } as const;
type HarvestKind = (typeof HARVEST_KIND)[keyof typeof HARVEST_KIND];

async function harvestTx(db: SQLiteDatabase, p: Planting, date: DayKey, kind: HarvestKind): Promise<void> {
  await db.runAsync('UPDATE planting SET harvested_date = ?, auto_harvested = ? WHERE id = ?', date, kind, p.id);
  await db.runAsync(
    'INSERT INTO inventory (crop, qty) VALUES (?, 1) ON CONFLICT(crop) DO UPDATE SET qty = qty + 1',
    p.crop,
  );
  await db.runAsync('UPDATE harvest_stat SET total_harvested = total_harvested + 1 WHERE id = 1');
}

/**
 * 자동 수확 정산 (트랜잭션 안에서). 오늘까지 수확됐어야 할 작물을 전부 따서 창고에 넣는다.
 * 앱을 며칠 안 열었어도 한 번에 정산하고, 수확한 날은 정산한 오늘로 적는다 (밤사이 소식·방송에 나오게).
 * 수확 레벨(누적 수확량)과 창고 수량도 이때 함께 오른다.
 */
async function settleAutoHarvestTx(db: SQLiteDatabase, today: DayKey): Promise<CropKind[]> {
  const due = dueForAutoHarvest(await activePlantingsOn(db), today);
  for (const p of due) await harvestTx(db, p, today, HARVEST_KIND.matured);
  return due.map((p) => p.crop);
}

/** 자동 수확 정산만 따로 (앱을 열거나 화면에 들어올 때) */
export function settleAutoHarvest(today: DayKey): Promise<void> {
  return writeTx(async (db) => {
    await settleAutoHarvestTx(db, today);
  });
}

// ── 읽기 ────────────────────────────────────────────────────────────────

export type FarmSnapshot = {
  active: Planting[];
  inventory: Partial<Record<CropKind, number>>;
  totalHarvested: number;
  /** 오늘 밭이 꽉 차서 대신 딴 작물 (방송용, 여러 개면 마지막) */
  autoHarvestedToday: CropKind | null;
  /** 오늘 정산한 자동 수확 작물 (밤사이 소식 · 방송) */
  harvestedToday: CropKind[];
  totalXp: number;
  /** 오늘(기기 시각 기준 하루) 받은 경험치 — 레벨업한 날인지 판단용 */
  xpGainedToday: number;
};

/** 밀린 자동 수확을 먼저 정산하고 밭 · 창고 · 경험치를 읽는다 */
export async function loadFarm(today: DayKey): Promise<FarmSnapshot> {
  await settleAutoHarvest(today);
  const db = await getDb();
  const active = await activePlantingsOn(db);
  const inv = await db.getAllAsync<{ crop: CropKind; qty: number }>('SELECT crop, qty FROM inventory');
  const stat = await db.getFirstAsync<{ total_harvested: number }>('SELECT total_harvested FROM harvest_stat WHERE id = 1');
  const auto = await db.getFirstAsync<{ crop: CropKind }>(
    'SELECT crop FROM planting WHERE auto_harvested = ? AND harvested_date = ? ORDER BY id DESC LIMIT 1',
    HARVEST_KIND.fieldFull,
    today,
  );
  const matured = await db.getAllAsync<{ crop: CropKind }>(
    'SELECT crop FROM planting WHERE auto_harvested = ? AND harvested_date = ? ORDER BY planted_date, id',
    HARVEST_KIND.matured,
    today,
  );
  const xpRows = await db.getAllAsync<{ amount: number; at: number }>('SELECT amount, at FROM village_xp');
  let totalXp = 0;
  let xpGainedToday = 0;
  for (const r of xpRows) {
    totalXp += r.amount;
    if (dayKeyOf(new Date(r.at)) === today) xpGainedToday += r.amount;
  }
  return {
    active,
    inventory: Object.fromEntries(inv.map((r) => [r.crop, r.qty])),
    totalHarvested: stat?.total_harvested ?? 0,
    autoHarvestedToday: auto?.crop ?? null,
    harvestedToday: matured.map((r) => r.crop),
    totalXp,
    xpGainedToday,
  };
}

// ── 기록 저장 + 씨앗 + 경험치 ────────────────────────────────────────────

export type SeedResult = {
  crop: CropKind;
  slot: number;
  /** 밭이 꽉 차서 대신 딴 작물 */
  autoHarvested: CropKind | null;
};

export type CommitResult = {
  /** 이번 저장으로 새 씨앗을 심었으면 그 결과. 고치기·이미 심은 날이면 null. */
  seed: SeedResult | null;
  xpGained: number;
};

/**
 * 하루 기록을 저장한다.
 * - 먼저 밀린 자동 수확을 정산해 밭을 비운다.
 * - 그날 기록의 씨앗이 아직 없고 최근 7일 안이면: 기록대로 작물을 정해 오늘 밭에 심는다
 *   (지난날 빈칸 기록도 씨앗은 오늘 심는다. 그래도 꽉 차 있으면 가장 오래된 작물을 대신 딴다).
 *   기록을 고쳐도 이미 심은 작물은 바뀌지 않는다.
 * - 경험치: 그날 기록으로 받은 경험치보다 많아질 때만 차이를 준다 (줄지 않는다).
 */
export function commitDayRecord(record: DayRecord, today: DayKey, now = Date.now()): Promise<CommitResult> {
  const result: CommitResult = { seed: null, xpGained: 0 };
  return writeTx(async (db) => {
    await saveDayRecordTx(db, record);
    await settleAutoHarvestTx(db, today);

    if (canEditRecord(record.date, today)) {
      const planted = await db.getFirstAsync<{ id: number }>('SELECT id FROM planting WHERE record_date = ?', record.date);
      if (!planted) {
        const crop = cropFor(record);
        const plan = planSeed(await activePlantingsOn(db));
        if (plan.autoHarvest) await harvestTx(db, plan.autoHarvest, today, HARVEST_KIND.fieldFull);
        await db.runAsync(
          'INSERT INTO planting (crop, record_date, planted_date, slot) VALUES (?, ?, ?, ?)',
          crop,
          record.date,
          today,
          plan.slot,
        );
        result.seed = { crop, slot: plan.slot, autoHarvested: plan.autoHarvest?.crop ?? null };
      }
    }

    const granted = await db.getFirstAsync<{ sum: number | null }>(
      'SELECT SUM(amount) AS sum FROM village_xp WHERE date = ?',
      record.date,
    );
    const delta = xpDelta(granted?.sum ?? 0, xpForRecord(record));
    if (delta > 0) {
      await db.runAsync(
        'INSERT INTO village_xp (date, amount, reason, at) VALUES (?, ?, ?, ?)',
        record.date,
        delta,
        granted?.sum ? 'record_edit' : 'record',
        now,
      );
      result.xpGained = delta;
    }
  }).then(() => result);
}

/** 기록한 날 수 (7d '기록 n일째') */
export async function countRecordDays(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM day_record');
  return row?.n ?? 0;
}
