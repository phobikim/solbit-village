// 밤사이 마을 소식 문구 (SPEC 10장). 상황 선택은 src/domain/news.ts.

import type { NewsItem } from '../domain/news';
import { CROP_NAME } from './crops.ko';
import type { CropKind } from '../domain/types';
import { eul, iga } from './josa';

export const NEWS_TITLE = '밤사이 마을 소식';
export const NEWS_LINE = '밤사이 있었던 일이유. 별일은 없었슈. 아마도유.';
export const NEWS_CLOSE = '마을 보러 가기';

/** 아침 로컬 알림 */
export const NEWS_NOTIFICATION = { title: '솔빛 마을', body: '📢 밤사이 마을 소식 왔슈' } as const;

const cropList = (crops: readonly string[]) => {
  const names = [...new Set(crops)].map((c) => CROP_NAME[c as keyof typeof CROP_NAME]);
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} 외 ${names.length - 2}종` : names.join(', ');
};

export function newsText(item: NewsItem): string {
  switch (item.kind) {
    case 'harvested': {
      const list = (Object.entries(item.counts) as [CropKind, number][]).map(([c, n]) => `${CROP_NAME[c]} ${n}개`).join(', ');
      return `${eul(list)} 따서 창고에 넣었슈.`;
    }
    case 'ripened':
      return `${iga(cropList(item.crops))} 다 익었슈. 내일 새벽에 알아서 따 두겄슈.`;
    case 'grew':
      return `${iga(cropList(item.crops))} 밤사이 쑥 자랐슈.`;
    case 'visitors':
      return `${iga(item.names.map((n) => `${n} 씨`).join(', '))} 놀러 와 있슈.`;
    case 'eventToday':
      return `오늘은 ${item.name} 날이유. 게시판에 붙여 뒀슈.`;
    case 'eventSoon':
      return `${item.name}까지 ${item.days}일 남았슈.`;
    case 'quiet':
      return '어제는 조용했슈. 고양이 한 마리 지나갔슈.';
  }
}
