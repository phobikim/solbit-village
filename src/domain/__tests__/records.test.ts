import { dayKeyOf, DAY_BOUNDARY_HOUR } from '../day';
import { frequentNeighbors } from '../neighbors';
import {
  canCreateRecord,
  canEditRecord,
  defaultDayType,
  emptyDraft,
  isDraftComplete,
  normalizeDraft,
  recordHeadline,
  RECORD_EDIT_WINDOW_DAYS,
} from '../records';
import { weatherFromScore, weatherOn } from '../weather';

describe('하루 경계 (새벽 4시)', () => {
  it('상수는 4시', () => expect(DAY_BOUNDARY_HOUR).toBe(4));
  it('새벽 1시 기록은 전날 기록', () => {
    expect(dayKeyOf(new Date(2026, 9, 21, 1, 0))).toBe('2026-10-20');
    expect(dayKeyOf(new Date(2026, 9, 21, 4, 0))).toBe('2026-10-21');
  });
});

describe('기록 수정 기간 (최근 7일)', () => {
  const today = '2026-10-20';
  it('오늘부터 6일 전까지 고칠 수 있다', () => {
    expect(RECORD_EDIT_WINDOW_DAYS).toBe(7);
    expect(canEditRecord('2026-10-20', today)).toBe(true);
    expect(canEditRecord('2026-10-14', today)).toBe(true);
    expect(canEditRecord('2026-10-13', today)).toBe(false);
  });
  it('미래 날짜는 안 된다', () => expect(canEditRecord('2026-10-21', today)).toBe(false));
  it('빈 날 새 기록: 최근 7일 안만', () => {
    expect(canCreateRecord(today, today)).toBe(true);
    expect(canCreateRecord('2026-10-14', today)).toBe(true);
    expect(canCreateRecord('2026-10-13', today)).toBe(false);
    expect(canCreateRecord('2026-10-21', today)).toBe(false);
  });
});

describe('기록 입력값', () => {
  it('컨디션과 일 강도가 있어야 저장 가능', () => {
    const d = emptyDraft();
    expect(isDraftComplete(d)).toBe(false);
    expect(isDraftComplete({ ...d, condition: 2 })).toBe(false);
    expect(isDraftComplete({ ...d, condition: 2, work: 1 })).toBe(true);
  });

  it('정리: 공백 → null, 여가·연락 중복 제거, 생성 시각 유지', () => {
    const r = normalizeDraft(
      '2026-10-20',
      {
        dayType: 'work',
        condition: 3,
        work: 2,
        memo: ' 산책함 ',
        leisure: ['산책', ' 산책 ', '', '독서'],
        restSize: 'firewood',
        contacts: [
          { neighborId: 'a', method: 'call' },
          { neighborId: 'a', method: 'meet' },
          { neighborId: 'b', method: 'message' },
        ],
      },
      200,
      { createdAt: 100 } as never,
    );
    expect(r).not.toHaveProperty('achievement'); // 오늘의 성취는 없어졌다
    expect(r.memo).toBe('산책함');
    expect(r.leisure).toEqual(['산책', '독서']);
    expect(r.contacts).toEqual([
      { neighborId: 'a', method: 'call' },
      { neighborId: 'b', method: 'message' },
    ]);
    expect(r.createdAt).toBe(100);
    expect(r.updatedAt).toBe(200);
  });

  it('카드 한 줄: 메모 → 여가 → 없음', () => {
    const base = normalizeDraft('2026-10-20', { ...emptyDraft(), condition: 2, work: 1 }, 1);
    expect(recordHeadline(base)).toBeNull();
    expect(recordHeadline({ ...base, leisure: ['산책', '영화'] })).toBe('산책 · 영화');
    expect(recordHeadline({ ...base, memo: '메모', leisure: ['산책'] })).toBe('메모');
  });
});

describe('날씨 ([제안] 값)', () => {
  it('점수 구간', () => {
    expect(weatherFromScore(3)).toBe('sun');
    expect(weatherFromScore(2.6)).toBe('sun');
    expect(weatherFromScore(2.2)).toBe('cloud');
    expect(weatherFromScore(2)).toBe('over');
    expect(weatherFromScore(1.4)).toBe('rain');
    expect(weatherFromScore(1)).toBe('storm');
  });

  it('그날 포함 최근 3일 중 기록 있는 날 평균', () => {
    const c = { '2026-10-18': 3, '2026-10-19': 1, '2026-10-20': 2 } as const;
    expect(weatherOn('2026-10-20', c)).toBe('over'); // (3+1+2)/3 = 2
    expect(weatherOn('2026-10-18', c)).toBe('sun'); // 3
    expect(weatherOn('2026-10-21', c)).toBeNull(); // 그날 기록 없음
  });
});

describe('자주 연락하는 이웃', () => {
  it('연락 많은 순 → 최근 순 → 먼저 등록 순, 최대 n명', () => {
    const list = [
      { id: 'a', name: 'a', createdAt: 1, contactCount: 2, lastContact: '2026-10-01' },
      { id: 'b', name: 'b', createdAt: 2, contactCount: 5, lastContact: '2026-09-01' },
      { id: 'c', name: 'c', createdAt: 3, contactCount: 2, lastContact: '2026-10-10' },
      { id: 'd', name: 'd', createdAt: 0, contactCount: 0, lastContact: null },
      { id: 'e', name: 'e', createdAt: 4, contactCount: 0, lastContact: null },
    ];
    expect(frequentNeighbors(list, 4).map((n) => n.id)).toEqual(['b', 'c', 'a', 'd']);
  });
});

describe('일한 날 / 쉬는 날 기본값', () => {
  it('평일은 일한 날', () => {
    for (const d of ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']) {
      expect(defaultDayType(d)).toBe('work');
    }
  });
  it('토 · 일은 쉬는 날', () => {
    expect(defaultDayType('2026-10-24')).toBe('rest');
    expect(defaultDayType('2026-10-25')).toBe('rest');
  });
  it('새 기록 초안이 그 기본값으로 시작한다', () => {
    expect(emptyDraft(defaultDayType('2026-10-24')).dayType).toBe('rest');
    expect(emptyDraft(defaultDayType('2026-10-26')).dayType).toBe('work');
  });
});
