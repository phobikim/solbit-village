import { byDate, rec } from '../__fixtures__/records';
import {
  dayScore,
  daysSinceFire,
  fireBand,
  fireIndex,
  isVisitLog,
  VISITED_TAG_LABEL,
  visitedTag,
  weekDays,
  weekLogs,
  fireMood,
  lastFireDay,
  logContacts,
  NO_REST,
  type RestLog,
  type RestSize,
} from '../fire';
import { computeIndices, relationIndex, weeklyTrend } from '../indices';
import { bestFriendOf, mergeContacts } from '../neighbors';

const today = '2026-10-22'; // 목요일

const log = (id: string, date: string, size: RestSize, over: Partial<RestLog> = {}): RestLog => ({
  id,
  date,
  text: '',
  tags: [],
  size,
  createdAt: 0,
  ...over,
});
const src = (logs: RestLog[], trips: string[] = []) => ({ logs, trips: new Set(trips) });
const noRecord = () => false;

describe('장작 점수: 잔가지 10 / 장작 20 / 통나무 35', () => {
  it('크기별 점수', () => {
    expect(fireIndex(src([log('a', today, 'twig')]), today, noRecord)).toBe(10);
    expect(fireIndex(src([log('a', today, 'firewood')]), today, noRecord)).toBe(20);
    expect(fireIndex(src([log('a', today, 'log')]), today, noRecord)).toBe(35);
  });
  it('최근 7일 합 (오늘 포함 7일, 8일 전은 빠진다)', () => {
    const logs = [log('a', today, 'firewood'), log('b', '2026-10-16', 'firewood'), log('c', '2026-10-15', 'log')];
    expect(fireIndex(src(logs), today, noRecord)).toBe(40); // 22일, 16일만
  });
  it('하루 최대 35: 같은 날 여러 개를 던져도 넘지 않는다', () => {
    const logs = [log('a', today, 'log'), log('b', today, 'log'), log('c', today, 'firewood')];
    expect(dayScore(logs, false)).toBe(35);
    expect(fireIndex(src(logs), today, noRecord)).toBe(35);
    expect(dayScore([log('a', today, 'twig'), log('b', today, 'twig')], false)).toBe(20);
    expect(dayScore([log('a', today, 'firewood'), log('b', today, 'twig')], false)).toBe(30);
  });
  it('상한 100', () => {
    const logs = ['22', '21', '20', '19'].map((d) => log(d, `2026-10-${d}`, 'log')); // 4일 × 35 = 140
    expect(fireIndex(src(logs), today, noRecord)).toBe(100);
  });
});

describe('다녀온 곳(n박)은 머문 날마다 통나무', () => {
  it('다녀온 날은 35, 그날 장작이 있어도 35를 넘지 않는다', () => {
    expect(dayScore([log('a', today, 'firewood')], true)).toBe(35);
    expect(fireIndex(src([log('a', '2026-10-20', 'firewood')], ['2026-10-20', '2026-10-21']), today, noRecord)).toBe(70);
  });
  it('2박 3일 = 통나무 3개 = 100(상한)', () => {
    expect(fireIndex(src([], ['2026-10-18', '2026-10-19', '2026-10-20']), today, noRecord)).toBe(100);
  });
  it('n박이 7일 창 밖으로 나가면 창 안의 날만', () => {
    expect(fireIndex(src([], ['2026-10-14', '2026-10-15', '2026-10-16']), today, noRecord)).toBe(35); // 16일만 창 안
  });
});

describe('쉼 지수가 없는 경우', () => {
  it('기록도 쉼도 다녀온 곳도 7일 안에 없으면 null', () => {
    expect(fireIndex(NO_REST, today, noRecord)).toBeNull();
    expect(fireIndex(src([log('a', '2026-10-01', 'log')]), today, noRecord)).toBeNull();
  });
  it('기록만 있으면 0 (불은 있는데 장작이 없다)', () => {
    expect(fireIndex(NO_REST, today, (d) => d === today)).toBe(0);
  });
});

describe('불 상태: 활활(70+) / 타오름(40+) / 사그라듦(20+) / 꺼져감', () => {
  it('경계', () => {
    expect([100, 70].map(fireBand)).toEqual(['blaze', 'blaze']);
    expect([69, 40].map(fireBand)).toEqual(['burning', 'burning']);
    expect([39, 20].map(fireBand)).toEqual(['dying', 'dying']);
    expect([19, 0].map(fireBand)).toEqual(['out', 'out']);
  });
});

describe('이번 주 7칸 · 장작 안 들어온 지 n일', () => {
  const logs = [log('a', '2026-10-19', 'twig'), log('b', '2026-10-21', 'firewood')];
  it('이번 주(월 ~ 일) 쉼 기록만, 최신이 위', () => {
    const list = [
      log('old', '2026-10-18', 'log'), // 지난주 일요일
      log('mon', '2026-10-19', 'twig'),
      log('wed', '2026-10-21', 'firewood', { createdAt: 5 }),
      log('wed2', '2026-10-21', 'twig', { createdAt: 9 }),
      log('sun', '2026-10-25', 'log'),
      log('next', '2026-10-26', 'log'), // 다음 주 월요일
    ];
    expect(weekLogs(list, '2026-10-19').map((l) => l.id)).toEqual(['sun', 'wed2', 'wed', 'mon']);
    expect(weekLogs([], '2026-10-19')).toEqual([]);
  });
  it('요일 7칸: 그날 가장 큰 장작 · 다녀온 곳 표시 · 기록 없는 날은 비어 있다', () => {
    const list = [
      log('a', '2026-10-19', 'twig'),
      log('b', '2026-10-19', 'log'),
      log('c', '2026-10-24', 'log', { tags: [visitedTag()] }),
      log('x', '2026-10-26', 'log'),
    ];
    const days = weekDays(list, '2026-10-19');
    expect(days.map((d) => d.date)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']);
    expect(days.map((d) => d.size)).toEqual(['log', null, null, null, null, 'log', null]);
    expect(days[0].logs.map((l) => l.id).sort()).toEqual(['a', 'b']);
    expect(days.map((d) => d.visit)).toEqual([false, false, false, false, false, true, false]);
  });
  it('불 세기 3단계: 꺼짐(꺼져감 · 기록 전) / 보통(사그라듦 · 타오름) / 뜨끈(활활)', () => {
    expect([null, 'out'].map((b) => fireMood(b as never))).toEqual(['off', 'off']);
    expect(['dying', 'burning'].map((b) => fireMood(b as never))).toEqual(['mid', 'mid']);
    expect(fireMood('blaze')).toBe('hot');
  });
  it('다녀온 곳에서 온 기록은 "다녀옴" 태그로 알아본다', () => {
    expect(VISITED_TAG_LABEL).toBe('다녀옴');
    expect(isVisitLog(log('v', '2026-10-20', 'log', { tags: [{ kind: 'place', label: '속초' }, visitedTag()] }))).toBe(true);
    expect(isVisitLog(log('n', '2026-10-20', 'log', { tags: [{ kind: 'place', label: '속초' }] }))).toBe(false);
    // 다른 종류의 같은 이름 태그는 아니다
    expect(isVisitLog(log('n2', '2026-10-20', 'log', { tags: [{ kind: 'activity', label: '다녀옴' }] }))).toBe(false);
  });
  it('n일 = 마지막 장작(또는 다녀온 날)부터 오늘까지', () => {
    expect(lastFireDay(src(logs), today)).toBe('2026-10-21');
    expect(daysSinceFire(src(logs), today)).toBe(1);
    expect(daysSinceFire(src([log('a', today, 'twig')]), today)).toBe(0);
    expect(daysSinceFire(src(logs, ['2026-10-10']), today)).toBe(1);
    expect(daysSinceFire(src([], ['2026-10-18']), today)).toBe(4);
  });
  it('한 번도 없으면 null, 미래 장작은 안 센다', () => {
    expect(daysSinceFire(NO_REST, today)).toBeNull();
    expect(daysSinceFire(src([log('x', '2026-10-30', 'log')]), today)).toBeNull();
  });
});

describe('메인 지수 · 4주 추세에도 같은 값', () => {
  it('computeIndices / weeklyTrend', () => {
    const rest = src([log('a', today, 'firewood')]);
    expect(computeIndices({}, [], today, rest).leisure).toBe(20);
    expect(weeklyTrend('leisure', {}, [], today, rest).at(-1)).toBe(20);
  });
});

describe('이웃 태그 → 그날 만남', () => {
  const tagged = (id: string, date: string, ...ids: string[]) =>
    log(id, date, 'twig', { tags: ids.map((ref) => ({ kind: 'neighbor' as const, label: ref, ref })) });

  it('이웃 태그는 만남 연락, 이웃 한 명은 하루 한 번', () => {
    const m = logContacts([tagged('a', '2026-10-20', 's', 'h'), tagged('b', '2026-10-20', 's')]);
    expect(m.get('2026-10-20')).toEqual([
      { neighborId: 's', method: 'meet' },
      { neighborId: 'h', method: 'meet' },
    ]);
  });
  it('태그를 빼면 같이 빠진다 (태그가 없는 쉼 기록은 연락이 없다)', () => {
    expect(logContacts([tagged('a', '2026-10-20')]).size).toBe(0);
    expect(logContacts([log('a', '2026-10-20', 'twig', { tags: [{ kind: 'activity', label: '산책' }] })]).size).toBe(0);
  });
  it('지금 없는 이웃은 거른다', () => {
    expect(logContacts([tagged('a', '2026-10-20', 'gone')], (id) => id !== 'gone').size).toBe(0);
  });
  it('기록의 연락과 합치면 하루 한 번, 기록 없는 날에도 들어간다', () => {
    const records = byDate(rec('2026-10-20', { contacts: [{ neighborId: 's', method: 'call' }] }));
    const merged = mergeContacts(records, logContacts([tagged('a', '2026-10-20', 's', 'h'), tagged('b', '2026-10-21', 's')]));
    expect(merged['2026-10-20'].contacts).toEqual([
      { neighborId: 's', method: 'call' },
      { neighborId: 'h', method: 'meet' },
    ]);
    expect(merged['2026-10-21'].contacts).toEqual([{ neighborId: 's', method: 'meet' }]);
    expect(bestFriendOf(merged, { year: 2026, month: 10 })).toBe('s');
    expect(records['2026-10-21']).toBeUndefined(); // 장작만 던진 날은 기록일이 아니다
  });
  it('관계 지수에 만남으로 반영된다', () => {
    const neighbors = [{ id: 's', frequency: 'often' as const, lastContact: null }];
    const records = byDate(rec(today));
    const without = computeIndices(records, neighbors, today).relation;
    const withTag = computeIndices(records, neighbors, today, src([tagged('a', today, 's')])).relation;
    expect(without).toBe(0);
    expect(withTag).toBe(60); // 연락 1/5 → 20, 주기 충족 1/1 → 100 → 평균 60
    expect(relationIndex(mergeContacts(records, new Map()), neighbors, today)).toBe(0);
  });
});
