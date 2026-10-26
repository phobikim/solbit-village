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
  sunflower: '잘 쉬었나 봐유. 해바라기가 고개를 들어유.',
  strawberry: '나눠 먹으라구 딸기가 나유.',
  coffee: '커피콩이 나유. 무슨 뜻인지 아실 거유.',
  mushroom: '비 오는 날엔 버섯이 잘 자라유. 나쁜 날만은 아니구먼유.',
  potato: '감자유. 감자두 소중혀유.',
};

/** 씨앗 결과(9b) 설명 — 왜 이 작물인지 */
export const CROP_REASON: Record<CropKind, string> = {
  sunflower: '잘 쉰 날엔 해바라기가 나유.',
  strawberry: '이웃 만난 날엔 딸기가 나유.',
  coffee: '일 많던 날엔 커피콩이 나유.',
  mushroom: '지친 날엔 버섯이 나유.',
  potato: '평범한 날엔 감자가 나유.',
};

export const GROW_HINT = '사흘 뒤에 보슈.';

/** 밭 띠 칸 상태 글자 (메인). 1일차 새싹 · 2일차 자라는 중 · 3일차는 다음 날 자동 수확 */
export const PLOT_STAGE_LABEL = { 1: '새싹', 2: '자라는 중', 3: '내일 수확' } as const;
export const PLOT_EMPTY_LABEL = '빈 밭';

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
export const AUTO_HARVEST_LINE = '대신 땄슈. 창고에 넣어놨슈.';
export const autoHarvestDesc = (oldCrop: string, newCrop: string, eul: (w: string) => string) =>
  `밭이 꽉 차서 젤 오래된 ${oldCrop} 따구 ${newCrop} 심었슈.`;

