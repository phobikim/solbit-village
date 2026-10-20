// 작물 이름 · 씨앗 결과 문구 (SPEC 5장 표)

import type { CropKind, DayRecord } from '../domain/types';

export const CROP_NAME: Record<CropKind, string> = {
  sunflower: '해바라기',
  strawberry: '딸기',
  coffee: '커피콩',
  mushroom: '버섯',
  potato: '감자',
};

/** 씨앗 결과(9b)의 이장 말풍선 — SPEC 5장 결과 문구 */
export const CROP_RESULT_LINE: Record<CropKind, string> = {
  sunflower: '잘 쉬었나 봅니다. 해바라기가 고개를 듭니다.',
  strawberry: '나눠 먹으라고 딸기가 납니다.',
  coffee: '커피콩이 납니다. 무슨 뜻인지 아실 겁니다.',
  mushroom: '비 오는 날엔 버섯이 잘 자랍니다. 나쁜 날만은 아니네요.',
  potato: '감자입니다. 감자도 소중합니다.',
};

/** 씨앗 결과(9b) 설명 — 왜 이 작물인지 */
export const CROP_REASON: Record<CropKind, string> = {
  sunflower: '잘 쉰 날엔 해바라기가 납니다.',
  strawberry: '이웃과 연락한 날엔 딸기가 납니다.',
  coffee: '일이 많았던 날엔 커피콩이 납니다.',
  mushroom: '지친 날엔 버섯이 납니다.',
  potato: '평범한 날엔 감자가 납니다.',
};

export const GROW_HINT = '3일 뒤에 보세요.';

const METHOD_LABEL = { call: '통화', meet: '만남', message: '메시지' } as const;

/** 씨앗 결과(9b) 위 작은 칩 — 그날 무슨 일이 있었는지 */
export function seedChip(
  crop: CropKind,
  r: Pick<DayRecord, 'contacts' | 'leisure'>,
  nameOf: (id: string) => string | undefined,
): string {
  switch (crop) {
    case 'mushroom':
      return '컨디션 지침';
    case 'coffee':
      return '일 강도 3';
    case 'strawberry': {
      const c = r.contacts[0];
      const name = c ? nameOf(c.neighborId) : undefined;
      const more = r.contacts.length > 1 ? ` 외 ${r.contacts.length - 1}명` : '';
      return name ? `${name} 씨와 ${METHOD_LABEL[c.method]}${more}` : '이웃과 연락';
    }
    case 'sunflower':
      return r.leisure.length ? `신남 · ${r.leisure[0]}` : '신남';
    case 'potato':
      return '평범한 하루';
  }
}

/** 자동 수확 말풍선 (9c) */
export const AUTO_HARVEST_LINE = '대신 땄습니다. 창고에 넣어놨습니다.';
export const autoHarvestDesc = (oldCrop: string, newCrop: string, eul: (w: string) => string) =>
  `밭이 꽉 차서 제일 오래된 ${eul(oldCrop)} 따고 ${eul(newCrop)} 심었습니다.`;
