import { byDate, rec } from '../__fixtures__/records';
import { cropFor } from '../crops';
import { leisureIndex, workIndex } from '../indices';
import { defaultDayType, emptyDraft, isDraftComplete, normalizeDraft } from '../records';
import { tripDays } from '../rest';
import { areasEntered, xpForRecord } from '../village';

const restDay = (date: string, over = {}) => rec(date, { dayType: 'rest', work: null, ...over });

describe('일한 날 / 쉬는 날 (디자인 14a · 14b, 2026-10-23)', () => {
  it('새 기록 기본값: 토 · 일은 쉬는 날', () => {
    expect(defaultDayType('2026-10-24')).toBe('rest'); // 토
    expect(defaultDayType('2026-10-25')).toBe('rest'); // 일
    expect(defaultDayType('2026-10-23')).toBe('work'); // 금
  });

  it('저장 조건: 일한 날은 컨디션 + 일 강도, 쉬는 날은 컨디션만', () => {
    expect(isDraftComplete({ ...emptyDraft('work'), condition: 2 })).toBe(false);
    expect(isDraftComplete({ ...emptyDraft('work'), condition: 2, work: 1 })).toBe(true);
    expect(isDraftComplete({ ...emptyDraft('rest'), condition: 2 })).toBe(true);
    expect(isDraftComplete(emptyDraft('rest'))).toBe(false);
  });

  it('쉬는 날 기록은 일 강도 없이 저장된다', () => {
    const r = normalizeDraft('2026-10-24', { ...emptyDraft('rest'), condition: 3 }, 1);
    expect(r).toMatchObject({ dayType: 'rest', work: null });
  });
});

describe('일 지수: 쉬는 날에 일 강도가 없으면 일 0', () => {
  it('평균에 0으로 들어간다', () => {
    const r = byDate(rec('2026-10-22', { work: 3 }), restDay('2026-10-24'));
    expect(workIndex(r, '2026-10-24')).toBe(45); // (90 + 0) / 2
  });
  it('쉬는 날에도 일 강도를 적었으면 그 값', () => {
    const r = byDate(restDay('2026-10-24', { work: 1 }));
    expect(workIndex(r, '2026-10-24')).toBe(20);
  });
});

describe('쉼 지수(모닥불): 장작(쉼 기록)만 센다', () => {
  // TODO(사용자 확인): 예전엔 쉬는 날로 적으면 쉼 칸이 비어도 쉰 날이었다. 모닥불은 쉼 기록만 센다.
  it('쉼 기록이 없으면 쉬는 날이어도 점수 0 (기록은 있으니 null은 아니다)', () => {
    const r = byDate(restDay('2026-10-24'), rec('2026-10-23'));
    expect(leisureIndex(r, '2026-10-24')).toBe(0);
  });
  it('쉬는 날 + 쉼 기록 + 다녀온 곳이 같은 날이면 하루 최대 35', () => {
    const r = byDate(restDay('2026-10-24', { leisure: ['산책'] }));
    const trips = tripDays([
      { id: 'a', name: '공원', duration: 'short', visited: true, memo: null, note: null, eventId: null, logId: null, visitedDate: '2026-10-24', nights: 0, addedDate: '2026-10-24', createdAt: 0 },
    ]);
    const log = { id: 'rec_2026-10-24', date: '2026-10-24', text: '', tags: [], size: 'log' as const, createdAt: 0 };
    expect(leisureIndex(r, '2026-10-24', { logs: [log], trips })).toBe(35);
  });
});

describe('경험치: 쉬는 날은 쉼 +5가 기본 (쉬어도 줄지 않는다)', () => {
  it('일한 날 · 쉬는 날 기본 경험치가 같다', () => {
    expect(xpForRecord(rec('2026-10-22'))).toBe(20); // 기록 10 + 건강 5 + 일 5
    expect(xpForRecord(restDay('2026-10-24'))).toBe(20); // 기록 10 + 건강 5 + 쉼 5
  });
  it('쉬는 날에 쉼 항목을 적어도 쉼은 한 번, 일 강도를 적으면 일도 +5', () => {
    expect(areasEntered(restDay('2026-10-24', { leisure: ['영화'] }))).toBe(2);
    expect(areasEntered(restDay('2026-10-24', { work: 2 }))).toBe(3);
  });
});

describe('작물: 규칙은 그대로', () => {
  it('쉬는 날(일 강도 없음)은 커피콩이 아니다', () => {
    expect(cropFor(restDay('2026-10-24'))).toBe('potato');
    expect(cropFor(restDay('2026-10-24', { work: 3 }))).toBe('coffee');
  });
});
