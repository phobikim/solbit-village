// 밤사이 마을 소식 문구 (SPEC 10장). 상황 선택은 src/domain/news.ts.

import type { NewsItem } from '../domain/news';
import { CROP_NAME } from './crops.ko';
import { iga } from './josa';

export const NEWS_TITLE = '밤사이 마을 소식';
export const NEWS_LINE = '밤사이 있었던 일입니다. 별일은 없었습니다. 아마도요.';
export const NEWS_CLOSE = '마을 보러 가기';

/** 아침 로컬 알림 */
export const NEWS_NOTIFICATION = { title: '솔빛 마을', body: '📢 밤사이 마을 소식이 도착했습니다' } as const;

const cropList = (crops: readonly string[]) => {
  const names = [...new Set(crops)].map((c) => CROP_NAME[c as keyof typeof CROP_NAME]);
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} 외 ${names.length - 2}종` : names.join(', ');
};

export function newsText(item: NewsItem): string {
  switch (item.kind) {
    case 'ripened':
      return `${iga(cropList(item.crops))} 다 익었습니다. 따도 되고, 안 따도 안 시듭니다.`;
    case 'grew':
      return `${iga(cropList(item.crops))} 밤사이 쑥 자랐습니다.`;
    case 'visitors':
      return `${iga(item.names.map((n) => `${n} 씨`).join(', '))} 놀러 와 있습니다.`;
    case 'eventToday':
      return `오늘은 ${item.name} 날입니다. 현수막 걸어 뒀습니다.`;
    case 'eventSoon':
      return `${item.name}까지 ${item.days}일 남았습니다.`;
    case 'quiet':
      return '어제는 조용했습니다. 고양이 한 마리 지나갔습니다.';
  }
}
