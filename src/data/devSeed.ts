// 개발용 샘플 이웃. 이웃 등록 화면(9f, 단계 5)이 생기기 전에 기록 시트의 "누구와"를 확인하는 용도.
// __DEV__에서만 버튼으로 노출한다 (출시 빌드에서는 숨김).

import { FIELD_SIZE, GROW_DAYS } from '../domain/crops';
import { addDays, type DayKey } from '../domain/day';
import type { CropKind } from '../domain/types';
import { writeTx } from './db';
import { insertNeighbor, newNeighborId, type Neighbor } from './neighbors';

const SAMPLES: Omit<Neighbor, 'id' | 'createdAt'>[] = [
  { name: '서연', face: 1, color: 4, relation: 'coworker', frequency: 'often' },
  { name: '하준', face: 5, color: 2, relation: 'friend', frequency: 'often' },
  { name: '할머니', face: 10, color: 1, relation: 'family', frequency: 'sometimes' },
  { name: '지은', face: 3, color: 0, relation: 'coworker', frequency: 'sometimes' },
  { name: '엄마', face: 2, color: 5, relation: 'family', frequency: 'often' },
  { name: '민수', face: 7, color: 3, relation: 'friend', frequency: 'rarely' },
  { name: '할아버지', face: 11, color: 1, relation: 'family', frequency: 'rarely' },
];

export async function seedSampleNeighbors(): Promise<void> {
  const now = Date.now();
  for (let i = 0; i < SAMPLES.length; i++) {
    await insertNeighbor({ ...SAMPLES[i], id: newNeighborId(now + i), createdAt: now + i });
  }
}

// ── 수확 · 교환 확인용 (개발 모드 전용, 출시 빌드에서는 화면에 나오지 않는다) ─────

const DEV_CROPS: readonly CropKind[] = ['strawberry', 'potato', 'sunflower', 'coffee', 'mushroom'];

/** 밭 5칸을 익은 작물로 채운다: 있는 작물은 익게, 빈 칸은 새로 심는다 (record_date 없음) */
export function devFillRipe(today: DayKey): Promise<void> {
  const ripeDay = addDays(today, -(GROW_DAYS - 1));
  return writeTx(async (db) => {
    await db.runAsync('UPDATE planting SET planted_date = ? WHERE harvested_date IS NULL', ripeDay);
    const used = await db.getAllAsync<{ slot: number }>('SELECT slot FROM planting WHERE harvested_date IS NULL');
    const taken = new Set(used.map((u) => u.slot));
    for (let slot = 0; slot < FIELD_SIZE; slot++) {
      if (taken.has(slot)) continue;
      await db.runAsync(
        'INSERT INTO planting (crop, record_date, planted_date, slot) VALUES (?, NULL, ?, ?)',
        DEV_CROPS[slot % DEV_CROPS.length],
        ripeDay,
        slot,
      );
    }
  });
}

/** 창고 작물을 종류마다 n개씩 더한다 (누적 수확량은 건드리지 않는다) */
export function devAddCrops(n = 10): Promise<void> {
  return writeTx(async (db) => {
    for (const crop of DEV_CROPS) {
      await db.runAsync(
        'INSERT INTO inventory (crop, qty) VALUES (?, ?) ON CONFLICT(crop) DO UPDATE SET qty = qty + excluded.qty',
        crop,
        n,
      );
    }
  });
}
