// 솔이 옷장 탭 · 옷 가게 문구. 코드에 하드코딩하지 않는다.

import type { Slot } from '../domain/outfit';

export const CLOSET_TITLE = '솔이 옷장';
export const CLOSET_PREVIEW_LABEL = '솔이 미리보기';

export const SEGMENT_CLOSET = '내 옷장';
export const SEGMENT_SHOP = '옷 가게';

/** 이장 말풍선 */
export const BUBBLE_CLOSET = '오늘은 뭘 입어 보시려유?';
export const BUBBLE_SHOP = '돈 모은 만큼만 사유.';
export const BUBBLE_BOUGHT = '잘 어울리네유.';

export const SLOT_LABEL: Record<Slot, string> = {
  head: '머리',
  face: '얼굴',
  body: '몸',
  back: '등',
  hand: '손',
  feet: '발',
};

export const GO_SHOP = '옷 가게 가기';
/** 가게 칸: 이미 가진 옷에 붙는 태그 */
export const OWNED_TAG = '보유';
/** "모자라요 -N" */
export const shortLabel = (lack: string) => `모자라요 -${lack}`;
export const SHORT_WORD = '모자라요';

/** 큰 사기 버튼: "사기 · 1,300" */
export const buyButtonLabel = (price: string) => `사기 · ${price}`;

// 구매 확인 시트
export const SHEET_NOW_COIN = '지금 코인';
export const SHEET_AFTER = '산 뒤';
export const SHEET_BUY = '사기';
export const SHEET_LATER = '다음에';

/** 칸 접근성 라벨 */
export const cellA11y = (name: string, state: { wearing?: boolean; tryOn?: boolean; owned?: boolean; price?: string; lack?: string }) =>
  [
    name,
    state.wearing ? '입는 중' : '',
    state.tryOn ? '입어 보는 중' : '',
    state.owned ? OWNED_TAG : '',
    state.price ? `${state.price} 코인` : '',
    state.lack ? shortLabel(state.lack) : '',
  ]
    .filter(Boolean)
    .join(', ');

export const OUTFIT_NAME: Record<string, string> = {
  'head-beanie': '비니',
  'head-catears': '고양이 귀',
  'head-wizard': '마법사 모자',
  'head-straw': '밀짚모자',
  'head-headphones': '헤드폰',
  'face-glasses': '안경',
  'face-heart': '하트',
  'face-star': '별',
  'body-hoodie': '후드티',
  'body-plaid': '체크남방',
  'body-sweater': '스웨터',
  'body-scarf': '목도리',
  'body-raincoat': '우비',
  'body-overall': '멜빵바지',
  'back-bundle': '보따리',
  'back-crossbag': '크로스백',
  'back-cape': '망토',
  'back-wings': '날개',
  'hand-umbrella': '우산',
  'hand-coffee': '커피',
  'hand-book': '책',
  'hand-balloon': '풍선',
  'feet-slippers': '슬리퍼',
  'feet-sneakers': '운동화',
  'feet-boots': '부츠',
};
