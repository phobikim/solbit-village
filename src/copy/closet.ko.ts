// 꾸미기(솔이 옷 · 마을 배경) 화면의 이장 말풍선 · 하단 액션 버튼 · 미리보기 칩 · 세그먼트 문구. 코드에 하드코딩하지 않는다.

/** 이장 말풍선 */
export const BUBBLE_DEFAULT = '오늘은 뭘 꾸며 보시려유?';
export const BUBBLE_NOT_OWNED = '돈 모은 만큼만 사유.';
export const BUBBLE_BOUGHT = '잘 어울리네유.';

/** 미리보기 카드의 "원래대로" 칩 */
export const PREVIEW_RESET = '원래대로';

export const ACTION_BUY = (price: string) => `구매하기 · ${price}`;
export const ACTION_SHORT = (lack: string) => `코인이 모자라요 · -${lack}`;
export const ACTION_EQUIP = '갈아입기';
export const ACTION_EQUIPPED = '착용 중';
export const ACTION_TAKE_OFF = '벗기';

/** 미리보기 아래 [솔이 | 마을] 세그먼트 */
export const SEGMENT_SOLI = '솔이';
export const SEGMENT_VILLAGE = '마을';
export const SEGMENT_A11Y = '꾸밀 대상';

/** 마을 모드 미리보기 카드 접근성 라벨 */
export const VILLAGE_PREVIEW_LABEL = '마을 미리보기';

/** 마을 모드 칸 접근성 라벨 */
export const bgCellA11y = (name: string, state: { wearing?: boolean; selected?: boolean; owned: boolean; price?: string }) =>
  [name, state.wearing ? '적용 중' : '', state.selected ? '선택함' : '', state.owned ? '' : `${state.price ?? ''} 코인, 안 가짐`].filter(Boolean).join(', ');
