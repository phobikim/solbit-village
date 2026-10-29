// 마을 보상표의 레벨별 해금 목록. id와 아이콘 종류만 둔다 — 표시 이름은 src/copy/rewards.ko.ts.
// TODO([미정]): 아래 해금 목록은 샘플이다. 실제 마을 건물 · 해금 구성이 정해지면 이 표와 문구를 통째로 바꾼다.

export type UnlockId =
  | 'house'
  | 'pond'
  | 'laundry'
  | 'windmill'
  | 'plazaOutfit'
  | 'jar'
  | 'well'
  | 'orchard'
  | 'mill'
  | 'festivalOutfit'
  | 'pavilion'
  | 'observatory';

/** 보상표 줄에 그리는 작은 아이콘 종류 */
export type UnlockIcon = 'house' | 'pond' | 'laundry' | 'windmill' | 'gift' | 'jar' | 'well' | 'orchard' | 'mill' | 'pavilion' | 'observatory';

export type UnlockInfo = { id: UnlockId; icon: UnlockIcon };

/** 인덱스 0 = Lv.1 */
export const VILLAGE_UNLOCKS: readonly UnlockInfo[] = [
  { id: 'house', icon: 'house' },
  { id: 'pond', icon: 'pond' },
  { id: 'laundry', icon: 'laundry' },
  { id: 'windmill', icon: 'windmill' },
  { id: 'plazaOutfit', icon: 'gift' },
  { id: 'jar', icon: 'jar' },
  { id: 'well', icon: 'well' },
  { id: 'orchard', icon: 'orchard' },
  { id: 'mill', icon: 'mill' },
  { id: 'festivalOutfit', icon: 'gift' },
  { id: 'pavilion', icon: 'pavilion' },
  { id: 'observatory', icon: 'observatory' },
];

/** 이 레벨에서 열리는 것. 표에 없는 레벨(Lv.13~)은 null. */
export function unlockForLevel(level: number): UnlockInfo | null {
  return VILLAGE_UNLOCKS[Math.floor(level) - 1] ?? null;
}
