// 단계 2용 목업 데이터 — 7b 기록 · 7c 이웃 · 7d 나 (design/ 시안 값).
// 단계 3~5에서 SQLite + src/domain 계산으로 교체한다.

import type { Closeness, Relation } from '../copy/labels.ko';
import type { DayKey } from '../domain/day';
import type { IndexKind, Weather } from '../domain/types';
import type { NpcHair, SoliMood } from '../ui/characters';

// ── 7b 기록 ─────────────────────────────────────────────────────────────

export type MockDayRecord = {
  date: DayKey;
  mood: SoliMood;
  work: 1 | 2 | 3;
  note: string;
  weather: Weather;
};

const W: Weather[] = [
  'sun', 'cloud', 'cloud', 'sun', 'over', 'rain', 'rain', 'over', 'cloud', 'sun',
  'sun', 'cloud', 'over', 'storm', 'rain', 'over', 'cloud', 'sun', 'rain', 'cloud',
];

/** 날짜별 날씨 (2026-10-01 ~ 10-20) */
export const mockWeatherByDay: Record<DayKey, Weather> = Object.fromEntries(
  W.map((w, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, w]),
);

/** 행사 날짜 (달력 현수막 표시) */
export const mockEventDays: DayKey[] = ['2026-10-27', '2026-11-04', '2026-11-19'];

export const mockRecords: MockDayRecord[] = [
  { date: '2026-10-20', mood: 'normal', work: 3, note: '야근. 저녁은 편의점 김밥', weather: 'cloud' },
  { date: '2026-10-19', mood: 'tired', work: 3, note: '회의 네 개. 목이 쉼', weather: 'rain' },
  { date: '2026-10-18', mood: 'happy', work: 1, note: '늦잠 자고 냇가 산책', weather: 'sun' },
  { date: '2026-10-17', mood: 'normal', work: 1, note: '엄마랑 장 보러 감', weather: 'cloud' },
  { date: '2026-10-16', mood: 'happy', work: 2, note: '하준이랑 통화, 퇴근 후 산책', weather: 'over' },
];

// ── 7c 이웃 ─────────────────────────────────────────────────────────────

export type MockNeighbor = {
  id: string;
  name: string;
  relation: Relation;
  color: string;
  hair: NpcHair;
  closeness: Closeness;
  /** 이번 달 연락·만남 횟수 */
  monthCount: number;
  bestFriend?: boolean;
};

/** 가까운 순 */
export const mockNeighbors: MockNeighbor[] = [
  { id: 'n1', name: '서연', relation: 'coworker', color: '#D9C9FF', hair: 'part', closeness: 'close', monthCount: 8, bestFriend: true },
  { id: 'n2', name: '하준', relation: 'friend', color: '#C9F2A6', hair: 'beanie', closeness: 'close', monthCount: 6 },
  { id: 'n3', name: '할머니', relation: 'family', color: '#F4E1C8', hair: 'perm', closeness: 'normal', monthCount: 3 },
  { id: 'n4', name: '지은', relation: 'coworker', color: '#FFB3C7', hair: 'bob', closeness: 'sometimes', monthCount: 2 },
  { id: 'n5', name: '엄마', relation: 'family', color: '#FFE7A3', hair: 'perm', closeness: 'sometimes', monthCount: 1 },
];

/** 안부 묻기 좋은 이웃 */
export const mockAskAfter: MockNeighbor[] = [
  { id: 'n6', name: '민수', relation: 'friend', color: '#BFD8FF', hair: 'cap', closeness: 'sometimes', monthCount: 0 },
];

// ── 7d 나 ───────────────────────────────────────────────────────────────

export const mockMe = {
  farmerTitle: '동네 농부',
  harvestLevel: 4,
  villageName: '솔빛 마을',
  recordDays: 132,
  trendRange: { from: '2026-09-22', to: '2026-10-20' } as { from: DayKey; to: DayKey },
  /** 최근 4주 주별 지수 (0~100, 오래된 주 → 이번 주) + 요약 문구 */
  trends: [
    { kind: 'health', values: [59, 49, 40, 44], summary: '살짝 하락' },
    { kind: 'work', values: [47, 62, 72, 79], summary: '계속 오름' },
    { kind: 'relation', values: [54, 44, 37, 32], summary: '하락' },
    { kind: 'leisure', values: [22, 29, 27, 34], summary: '조금 오름' },
  ] satisfies { kind: IndexKind; values: number[]; summary: string }[],
  upcomingEvents: 3,
  storedCrops: 23,
  /** 교환 가능한 스킨이 있으면 수확 창고 카드에 분홍 점 */
  canExchange: true,
  /** TODO: 해금 레벨은 SPEC 6장 [미정] (제안: Lv.10) */
  patternsUnlockLevel: 10,
  villageLevel: 7,
};
