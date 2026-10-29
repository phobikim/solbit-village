import { hidesBottomBar, tabOfPath } from '../navigation';

describe('하단 바 탭 (마을 · 장부 · 이웃 · 쉼터 · 나)', () => {
  it('탭 화면', () => {
    expect(tabOfPath('/')).toBe('village');
    expect(tabOfPath('/records')).toBe('records');
    expect(tabOfPath('/neighbors')).toBe('neighbors');
    expect(tabOfPath('/rest')).toBe('rest');
    expect(tabOfPath('/me')).toBe('me');
  });
  it('하위 화면', () => {
    expect(tabOfPath('/storage')).toBe('me');
    expect(tabOfPath('/settings')).toBe('me');
  });
  it('시트 · 결과 카드는 어느 탭도 아님 (아래 탭 유지)', () => {
    expect(tabOfPath('/record')).toBeNull();
    expect(tabOfPath('/ledger/new')).toBeNull();
    expect(tabOfPath('/place-new')).toBeNull();
    expect(tabOfPath('/seed-result')).toBeNull();
    expect(tabOfPath('/neighbor-new')).toBeNull();
    expect(tabOfPath('/morning-news')).toBeNull();
    expect(tabOfPath('/meadow')).toBeNull();
    expect(tabOfPath('/restaurant')).toBeNull();
  });
});

describe('전체 화면', () => {
  it('/wake에서는 하단 바를 숨긴다', () => {
    expect(hidesBottomBar('/wake')).toBe(true);
    expect(hidesBottomBar('/morning/day')).toBe(true);
    expect(hidesBottomBar('/morning/outfit')).toBe(true);
    expect(hidesBottomBar('/')).toBe(false);
    expect(hidesBottomBar('/records')).toBe(false);
  });
});
