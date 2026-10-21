import { tabOfPath } from '../navigation';

describe('하단 바 탭', () => {
  it('탭 화면', () => {
    expect(tabOfPath('/')).toBe('village');
    expect(tabOfPath('/records')).toBe('records');
    expect(tabOfPath('/neighbors')).toBe('neighbors');
    expect(tabOfPath('/me')).toBe('me');
  });
  it('하위 화면은 나 탭', () => {
    expect(tabOfPath('/ledger')).toBe('me');
    expect(tabOfPath('/ledger/new')).toBe('me');
    expect(tabOfPath('/storage')).toBe('me');
    expect(tabOfPath('/settings')).toBe('me');
  });
  it('시트 · 결과 카드는 어느 탭도 아님 (아래 탭 유지)', () => {
    expect(tabOfPath('/record')).toBeNull();
    expect(tabOfPath('/seed-result')).toBeNull();
    expect(tabOfPath('/neighbor-new')).toBeNull();
    expect(tabOfPath('/morning-news')).toBeNull();
    expect(tabOfPath('/meadow')).toBeNull();
  });
});
