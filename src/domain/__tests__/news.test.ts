import type { Planting } from '../crops';
import type { VillageEvent } from '../events';
import { newsText } from '../../copy/news.ko';
import { DEFAULT_NEWS_ALARM, formatAlarmTime, morningNews, parseAlarmTime, shiftAlarmTime, shouldShowNews } from '../news';

const today = '2026-10-21';
const p = (id: number, crop: Planting['crop'], plantedDate: string, slot = id): Planting => ({ id, crop, plantedDate, slot });
const ev = (name: string, date: string): VillageEvent => ({ id: name, name, date, type: 'etc', repeatYearly: false, createdAt: 0 });

describe('밤사이 마을 소식', () => {
  it('아무 일도 없으면 조용한 소식 (기록이 없던 날에도 소식은 온다)', () => {
    expect(morningNews({ today, active: [], visitors: [], events: [] })).toEqual([{ kind: 'quiet' }]);
  });

  it('밤사이 익은 작물 · 자란 작물 (오늘 심은 것 · 이미 익어 있던 것은 빼고)', () => {
    const active = [
      p(1, 'strawberry', '2026-10-19'), // 어제 2단계 → 오늘 3단계: 익음
      p(2, 'potato', '2026-10-20'), // 어제 1 → 오늘 2: 자람
      p(3, 'coffee', '2026-10-21'), // 오늘 심음
      p(4, 'sunflower', '2026-10-10'), // 원래 익어 있음
    ];
    expect(morningNews({ today, active, visitors: [], events: [] })).toEqual([
      { kind: 'ripened', crops: ['strawberry'] },
      { kind: 'grew', crops: ['potato'] },
    ]);
  });

  it('놀러 온 이웃, 오늘 · 3일 안의 행사 (가까운 순)', () => {
    const items = morningNews({
      today,
      active: [],
      visitors: ['하준'],
      events: [ev('먼 행사', '2026-10-30'), ev('시험', '2026-10-24'), ev('엄마 생신', today), ev('지난 행사', '2026-10-01')],
    });
    expect(items).toEqual([
      { kind: 'visitors', names: ['하준'] },
      { kind: 'eventToday', name: '엄마 생신' },
      { kind: 'eventSoon', name: '시험', days: 3 },
    ]);
  });

  it('그날 처음 열 때만', () => {
    expect(shouldShowNews(null, today)).toBe(true);
    expect(shouldShowNews('2026-10-20', today)).toBe(true);
    expect(shouldShowNews(today, today)).toBe(false);
  });
});


describe('아침 알림 시각', () => {
  it('읽기 · 쓰기, 이상한 값은 기본값', () => {
    expect(parseAlarmTime('07:30')).toEqual({ hour: 7, minute: 30 });
    expect(parseAlarmTime(null)).toEqual(parseAlarmTime(DEFAULT_NEWS_ALARM));
    expect(parseAlarmTime('25:00')).toEqual(parseAlarmTime(DEFAULT_NEWS_ALARM));
    expect(formatAlarmTime({ hour: 7, minute: 5 })).toBe('07:05');
  });
  it('30분씩 앞뒤로, 자정을 넘어가면 돈다', () => {
    expect(shiftAlarmTime({ hour: 8, minute: 0 }, 30)).toEqual({ hour: 8, minute: 30 });
    expect(shiftAlarmTime({ hour: 0, minute: 0 }, -30)).toEqual({ hour: 23, minute: 30 });
    expect(shiftAlarmTime({ hour: 23, minute: 30 }, 30)).toEqual({ hour: 0, minute: 0 });
  });
});

describe('소식 문구', () => {
  it('조사와 조용한 날', () => {
    expect(newsText({ kind: 'visitors', names: ['하준', '서연'] })).toBe('하준 씨, 서연 씨가 놀러 와 있습니다.');
    expect(newsText({ kind: 'ripened', crops: ['mushroom'] })).toContain('버섯이 다 익었습니다');
    expect(newsText({ kind: 'grew', crops: ['potato', 'strawberry', 'coffee'] })).toBe('감자, 딸기 외 1종이 밤사이 쑥 자랐습니다.');
    expect(newsText({ kind: 'quiet' })).toBe('어제는 조용했습니다. 고양이 한 마리 지나갔습니다.');
  });
});

describe('밤사이 소식: 자동 수확', () => {
  it('작물별 수량 + 창고에 넣었습니다 (맨 앞)', () => {
    const items = morningNews({ today, active: [], visitors: ['하준'], events: [], harvested: ['strawberry', 'potato', 'strawberry'] });
    expect(items[0]).toEqual({ kind: 'harvested', counts: { strawberry: 2, potato: 1 } });
    expect(newsText(items[0])).toBe('딸기 2개, 감자 1개를 따서 창고에 넣었습니다.');
  });
  it('다 익은 작물은 내일 새벽에 딴다고 알려준다', () => {
    expect(newsText({ kind: 'ripened', crops: ['potato'] })).toBe('감자가 다 익었습니다. 내일 새벽에 알아서 따 두겠습니다.');
  });
});
