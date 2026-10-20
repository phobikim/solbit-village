// 밭 · 창고 · 경험치 저장소, 그리고 "기록 저장 + 씨앗 심기 + 경험치"를 한 트랜잭션으로 묶는 함수.
// 어떤 작물을 어디에 심을지는 src/domain이 정하고, 여기서는 그대로 쓴다.

import type { SQLiteDatabase } from 'expo-sqlite';

import { cropFor, planSeed, ripePlantings, type Planting } from '../domain/crops';
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

async function harvestTx(db: SQLiteDatabase, p: Planting, date: DayKey, auto: boolean): Promise<void> {
  await db.runAsync('UPDATE planting SET harvested_date = ?, auto_harvested = ? WHERE id = ?', date, auto ? 1 : 0, p.id);
  await db.runAsync(
    'INSERT INTO inventory (crop, qty) VALUES (?, 1) ON CONFLICT(crop) DO UPDATE SET qty = qty + 1',
    p.crop,
  );
  await db.runAsync('UPDATE harvest_stat SET total_harvested = total_harvested + 1 WHERE id = 1');
}

// ── 읽기 ────────────────────────────────────────────────────────────────

export type FarmSnapshot = {
  active: Planting[];
  inventory: Partial<Record<CropKind, number>>;
  totalHarvested: number;
  /** 오늘 자동 수확된 작물 (방송용, 여러 개면 마지막) */
  autoHarvestedToday: CropKind | null;
  totalXp: number;
  /** 오늘(기기 시각 기준 하루) 받은 경험치 — 레벨업한 날인지 판단용 */
  xpGainedToday: number;
};

export async function loadFarm(today: DayKey): Promise<FarmSnapshot> {
  const db = await getDb();
  const active = await activePlantingsOn(db);
  const inv = await db.getAllAsync<{ crop: CropKind; qty: number }>('SELECT crop, qty FROM inventory');
  const stat = await db.getFirstAsync<{ total_harvested: number }>('SELECT total_harvested FROM harvest_stat WHERE id = 1');
  const auto = await db.getFirstAsync<{ crop: CropKind }>(
    'SELECT crop FROM planting WHERE auto_harvested = 1 AND harvested_date = ? ORDER BY id DESC LIMIT 1',
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
 * - 그날 씨앗이 아직 없고 그날이 오늘이면: 기록대로 작물을 정해 심는다 (꽉 차면 가장 오래된 작물 자동 수확).
 *   기록을 고쳐도 이미 심은 작물은 바뀌지 않는다.
 * - 경험치: 그날 기록으로 받은 경험치보다 많아질 때만 차이를 준다 (줄지 않는다).
 */
export function commitDayRecord(record: DayRecord, today: DayKey, now = Date.now()): Promise<CommitResult> {
  const result: CommitResult = { seed: null, xpGained: 0 };
  return writeTx(async (db) => {
    await saveDayRecordTx(db, record);

    if (record.date === today) {
      const planted = await db.getFirstAsync<{ id: number }>('SELECT id FROM planting WHERE planted_date = ?', record.date);
      if (!planted) {
        const crop = cropFor(record);
        const plan = planSeed(await activePlantingsOn(db));
        if (plan.autoHarvest) await harvestTx(db, plan.autoHarvest, today, true);
        await db.runAsync('INSERT INTO planting (crop, planted_date, slot) VALUES (?, ?, ?)', crop, record.date, plan.slot);
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

// ── 직접 수확 ───────────────────────────────────────────────────────────

export type HarvestResult = {
  /** 이번에 딴 작물 (오래된 순) */
  crops: CropKind[];
  totalBefore: number;
  totalAfter: number;
};

/** 밭의 익은 작물을 전부 수확한다. 익은 게 없으면 빈 결과. */
export function harvestRipe(today: DayKey): Promise<HarvestResult> {
  const result: HarvestResult = { crops: [], totalBefore: 0, totalAfter: 0 };
  return writeTx(async (db) => {
    const stat = await db.getFirstAsync<{ total_harvested: number }>('SELECT total_harvested FROM harvest_stat WHERE id = 1');
    result.totalBefore = stat?.total_harvested ?? 0;
    for (const p of ripePlantings(await activePlantingsOn(db), today)) {
      await harvestTx(db, p, today, false);
      result.crops.push(p.crop);
    }
    result.totalAfter = result.totalBefore + result.crops.length;
  }).then(() => result);
}

/** 기록한 날 수 (7d '기록 n일째') */
export async function countRecordDays(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM day_record');
  return row?.n ?? 0;
}
