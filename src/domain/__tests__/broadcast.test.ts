import { broadcasts, broadcastText } from '../../copy/broadcasts.ko';
import { eul, iga } from '../../copy/josa';
import { selectBroadcast, type BroadcastContext } from '../broadcast';
import { bestFriendOf, villageVisitors } from '../neighbors';
import { byDate, rec } from '../__fixtures__/records';

const base: BroadcastContext = {
  weather: 'sun',
  eventToday: null,
  eventTomorrow: null,
  eventInAWeek: null,
  boardEmpty: false,
  exchangeReady: null,
  leveledUpToday: false,
  autoHarvestedToday: null,
  visitorFromYesterday: null,
  workIndex: 30,
  leisureIndex: 60,
  recentRecordCount: 5,
  todayRecordOnly: false,
  bestFriendName: null,
  harvestedToday: [],
};

describe('방송 선택', () => {
  it('폭풍이면 무조건 개그 없는 짧은 방송', () => {
    const s = selectBroadcast({ ...base, weather: 'storm', leveledUpToday: true, visitorFromYesterday: '하준' });
    expect(s).toEqual({ kind: 'storm', eventTomorrow: null });
    expect(broadcastText(s)).toBe('...오늘은 방송 안 해유. 푹 쉬슈. 이상.');
  });

  it('우선순위: 레벨업 > 자동 수확 > 이웃 방문 > 일 과열 > 여가 부족', () => {
    expect(selectBroadcast({ ...base, leveledUpToday: true, autoHarvestedToday: 'potato' }).kind).toBe('villageLevelUp');
    expect(selectBroadcast({ ...base, autoHarvestedToday: 'potato', visitorFromYesterday: '하준' }).kind).toBe('autoHarvest');
    expect(selectBroadcast({ ...base, visitorFromYesterday: '하준', workIndex: 90 }).kind).toBe('neighborVisit');
    expect(selectBroadcast({ ...base, workIndex: 90, leisureIndex: 0 }).kind).toBe('workOverheat');
    expect(selectBroadcast({ ...base, leisureIndex: 10 }).kind).toBe('leisureLow');
  });

  it('행사 전날 > 레벨업, 자동 수확 > 교환 가능 > 이웃 방문', () => {
    expect(selectBroadcast({ ...base, eventTomorrow: { name: '엄마 생신', type: 'birth' }, leveledUpToday: true }).kind).toBe('eventEve');
    const ex = { crop: 'potato' as const, count: 10, skin: '밀짚모자' };
    expect(selectBroadcast({ ...base, autoHarvestedToday: 'potato', exchangeReady: ex }).kind).toBe('autoHarvest');
    expect(selectBroadcast({ ...base, exchangeReady: ex, visitorFromYesterday: '하준' }).kind).toBe('exchangeReady');
    expect(broadcastText({ kind: 'exchangeReady', ...ex })).toBe(
      '아아, 이장이유. 감자 10개 모였슈. 밀짚모자랑 바꿀 수 있슈, 안 바꿔도 되구유.',
    );
    expect(broadcastText({ kind: 'exchangeReady', crop: 'mushroom', count: 5, skin: '버섯 우산' })).toContain('버섯 5개 모였슈. 버섯 우산이랑');
    expect(broadcastText({ kind: 'eventEve', name: '엄마 생신', type: 'birth' })).toBe(
      '아아, 이장이유. 내일이 엄마 생신이유. 빈손으로 가지 마슈.',
    );
  });

  it('폭풍 + 행사 전날: 톤은 유지하고 행사 정보만 남긴다', () => {
    const s = selectBroadcast({ ...base, weather: 'storm', eventTomorrow: { name: '엄마 생신', type: 'birth' }, leveledUpToday: true });
    expect(s).toEqual({ kind: 'storm', eventTomorrow: '엄마 생신' });
    expect(broadcastText(s)).toBe('...오늘은 방송 안 해유. 내일 엄마 생신만 기억허슈. 푹 쉬슈.');
  });

  it('여가 부족은 기록이 3일 이상 있을 때만', () => {
    expect(selectBroadcast({ ...base, leisureIndex: 0, recentRecordCount: 1 }).kind).toBe('quiet');
  });

  it('그 밖: 기록만 한 날 > 익은 작물 > 흐림 > 단짝 > 조용', () => {
    expect(selectBroadcast({ ...base, todayRecordOnly: true, weather: 'rain' }).kind).toBe('recordOnly');
    expect(selectBroadcast({ ...base, weather: 'over', bestFriendName: '서연' }).kind).toBe('cloudy');
    expect(selectBroadcast({ ...base, bestFriendName: '서연' })).toEqual({ kind: 'bestFriend', name: '서연' });
    expect(selectBroadcast(base).kind).toBe('quiet');
  });

  it('문구: 머리말과 조사', () => {
    expect(broadcastText({ kind: 'autoHarvest', crop: 'strawberry' })).toBe(
      '아아, 이장이유. 밭이 꽉 차서 젤 오래된 딸기를 대신 땄슈. 창고에 넣어놨슈.',
    );
    expect(broadcastText({ kind: 'autoHarvest', crop: 'mushroom' })).toContain('버섯을 대신');
    expect(broadcastText({ kind: 'neighborVisit', name: '하준' })).toBe(`아아, 이장이유. ${broadcasts.neighborVisit('하준')}`);
  });

  it('조사', () => {
    expect(eul('감자')).toBe('감자를');
    expect(eul('커피콩')).toBe('커피콩을');
    expect(iga('버섯')).toBe('버섯이');
    expect(iga('해바라기')).toBe('해바라기가');
  });
});

describe('이웃: 단짝 · 마을 방문', () => {
  const c = (id: string, method: 'call' | 'meet' | 'message' = 'call') => ({ neighborId: id, method });

  it('이번 달 연락이 가장 많은 이웃이 단짝, 같으면 최근', () => {
    const records = byDate(
      rec('2026-10-02', { contacts: [c('a'), c('b')] }),
      rec('2026-10-05', { contacts: [c('b')] }),
      rec('2026-10-09', { contacts: [c('a')] }),
      rec('2026-09-30', { contacts: [c('z'), c('z')] }),
    );
    expect(bestFriendOf(records, { year: 2026, month: 10 })).toBe('a');
    expect(bestFriendOf({}, { year: 2026, month: 10 })).toBeNull();
  });

  it('어제 연락한 이웃이 먼저(만남 우선), 남으면 최근 많이 연락한 이웃', () => {
    const records = byDate(
      rec('2026-10-19', { contacts: [c('b', 'message'), c('a', 'meet')] }),
      rec('2026-10-15', { contacts: [c('c'), c('d')] }),
      rec('2026-10-12', { contacts: [c('c')] }),
    );
    const active = new Set(['a', 'b', 'c', 'd']);
    expect(villageVisitors(records, '2026-10-20', active)).toEqual(['a', 'b']);
    expect(villageVisitors(records, '2026-10-20', active, 3)).toEqual(['a', 'b', 'c']);
  });

  it('보관한(목록에 없는) 이웃은 오지 않는다', () => {
    const records = byDate(rec('2026-10-19', { contacts: [c('gone', 'meet')] }));
    expect(villageVisitors(records, '2026-10-20', new Set(['a']))).toEqual([]);
  });
});

describe('밤사이 자동 수확 방송', () => {
  it('레벨업 다음, 꽉 찬 밭 대신 딴 것·교환 가능보다 먼저', () => {
    expect(selectBroadcast({ ...base, harvestedToday: ['strawberry'], leveledUpToday: true }).kind).toBe('villageLevelUp');
    expect(selectBroadcast({ ...base, harvestedToday: ['strawberry'], autoHarvestedToday: 'potato' }).kind).toBe('overnightHarvest');
    expect(selectBroadcast({ ...base, harvestedToday: ['strawberry'], visitorFromYesterday: '하준' }).kind).toBe('overnightHarvest');
  });
  it('문구', () => {
    expect(broadcastText({ kind: 'overnightHarvest', crops: ['strawberry'] })).toBe(
      '아아, 이장이유. 밤사이 딸기를 따서 창고에 넣었슈. 손 하나 까딱 안 하셨슈.',
    );
    expect(broadcastText({ kind: 'overnightHarvest', crops: ['strawberry', 'potato', 'strawberry', 'mushroom'] })).toContain(
      '밤사이 딸기, 감자, 버섯을 따서',
    );
  });
  it('폭풍이면 수확했어도 개그 없는 방송', () => {
    expect(selectBroadcast({ ...base, weather: 'storm', harvestedToday: ['potato'] }).kind).toBe('storm');
  });
});

describe('마을 게시판 행사 방송', () => {
  const e = (name: string, type: 'travel' | 'birth' | 'work' | 'meet' | 'etc') => ({ name, type });
  it('행사 당일 > 전날 > … > 일주일 전 (이웃 방문보다 먼저)', () => {
    expect(selectBroadcast({ ...base, eventToday: e('사파 여행', 'travel'), eventTomorrow: e('엄마 생신', 'birth') }).kind).toBe('eventToday');
    expect(selectBroadcast({ ...base, eventInAWeek: e('사파 여행', 'travel'), visitorFromYesterday: '하준' }).kind).toBe('eventWeek');
    expect(selectBroadcast({ ...base, eventInAWeek: e('x', 'etc'), exchangeReady: { crop: 'potato', count: 10, skin: '밀짚모자' } }).kind).toBe('exchangeReady');
  });
  it('문구: 분류별 한마디', () => {
    expect(broadcastText({ kind: 'eventToday', ...e('사파 여행', 'travel') })).toBe(
      '아아, 이장이유. 오늘은 사파 여행 날이유. 다녀오슈. 마을은 이장이 지켜유, 대충유.',
    );
    expect(broadcastText({ kind: 'eventWeek', ...e('사파 여행', 'travel') })).toBe(
      '아아, 이장이유. 사파 여행 일주일 남았슈. 짐은 아직 안 쌌겄슈.',
    );
  });
  it('게시판이 비면 조용한 날도 게시판 이야기', () => {
    expect(selectBroadcast({ ...base, boardEmpty: true })).toEqual({ kind: 'quiet', boardEmpty: true });
    expect(broadcastText({ kind: 'quiet', boardEmpty: true })).toBe('아아, 이장이유. 게시판이 비었슈. 이장이 일을 안 한 건 아니유.');
    expect(broadcastText({ kind: 'quiet', boardEmpty: false })).toContain('오늘두 마을은 조용허유');
  });
  it('폭풍이면 행사 당일이어도 개그 없는 방송', () => {
    expect(selectBroadcast({ ...base, weather: 'storm', eventToday: e('사파 여행', 'travel') }).kind).toBe('storm');
  });
});
