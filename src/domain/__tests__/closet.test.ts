import { changeSlot, composePreview, EMPTY_PICK, getActionState, gridItems, isPreviewDirty, pickItem, syncPreview } from '../closet';
import { equip, STARTS_OWNED } from '../outfit';

const OWNED = new Set(STARTS_OWNED);
const EQUIPPED = equip({}, 'body-hoodie', OWNED);
const item = (id: string) => ({ id, slot: id.split('-')[0] as 'head' | 'face' | 'body' | 'back' | 'hand' | 'feet' });

describe('하단 액션 버튼 상태', () => {
  it('안 가진 옷: 코인 충분하면 buy, 모자라면 short', () => {
    const ctx = { owned: OWNED, equipped: EQUIPPED, coins: 300 };
    expect(getActionState(item('body-sweater'), ctx)).toEqual({ kind: 'buy', price: 300 });
    expect(getActionState(item('back-wings'), ctx)).toEqual({ kind: 'short', price: 800, lack: 500 });
  });

  it('경계: 잔액 == 가격이면 buy, 가격-1이면 short', () => {
    expect(getActionState(item('body-sweater'), { owned: OWNED, equipped: {}, coins: 300 })).toEqual({ kind: 'buy', price: 300 });
    expect(getActionState(item('body-sweater'), { owned: OWNED, equipped: {}, coins: 299 })).toEqual({ kind: 'short', price: 300, lack: 1 });
  });

  it('가진 옷: 안 입으면 equip, 입는 중이면 equipped', () => {
    expect(getActionState(item('head-beanie'), { owned: OWNED, equipped: EQUIPPED, coins: 0 })).toEqual({ kind: 'equip' });
    expect(getActionState(item('body-hoodie'), { owned: OWNED, equipped: EQUIPPED, coins: 0 })).toEqual({ kind: 'equipped' });
  });

  it('코인이 0이어도 가진 옷은 갈아입을 수 있다', () => {
    expect(getActionState(item('face-glasses'), { owned: OWNED, equipped: {}, coins: 0 })).toEqual({ kind: 'equip' });
  });

  it('모르는 옷은 null', () => {
    expect(getActionState({ id: 'head-crown', slot: 'head' }, { owned: OWNED, equipped: {}, coins: 99999 })).toBeNull();
  });
});

describe('미리보기', () => {
  it('누르면 선택 + 그 슬롯 미리보기에만 입힌다 (착용은 그대로)', () => {
    const s = pickItem(EMPTY_PICK, 'body-sweater', EQUIPPED);
    expect(s.selected).toBe('body-sweater');
    expect(composePreview(EQUIPPED, s.preview).body).toBe('body-sweater');
    expect(EQUIPPED.body).toBe('body-hoodie');
    expect(isPreviewDirty(EQUIPPED, s.preview)).toBe(true);
  });

  it('여러 슬롯을 겹쳐 입어 볼 수 있다', () => {
    let s = pickItem(EMPTY_PICK, 'body-sweater', EQUIPPED);
    s = changeSlot(s);
    s = pickItem(s, 'head-straw', EQUIPPED);
    expect(composePreview(EQUIPPED, s.preview)).toMatchObject({ body: 'body-sweater', head: 'head-straw' });
  });

  it('같은 칸을 다시 누르면 선택 해제 + 그 슬롯만 복원', () => {
    let s = pickItem(EMPTY_PICK, 'body-sweater', EQUIPPED);
    s = changeSlot(s);
    s = pickItem(s, 'head-straw', EQUIPPED);
    s = pickItem(s, 'head-straw', EQUIPPED);
    expect(s.selected).toBeNull();
    const shown = composePreview(EQUIPPED, s.preview);
    expect(shown.body).toBe('body-sweater');
    expect(shown.head).toBeUndefined();
  });

  it('슬롯 탭을 바꾸면 선택만 풀리고 다른 슬롯 미리보기는 남는다', () => {
    const s = changeSlot(pickItem(EMPTY_PICK, 'body-sweater', EQUIPPED));
    expect(s.selected).toBeNull();
    expect(s.preview.body).toBe('body-sweater');
  });

  it('입고 있는 옷을 누르면 미리보기에 남기지 않는다 (원래대로 칩 없음)', () => {
    const s = pickItem(EMPTY_PICK, 'body-hoodie', EQUIPPED);
    expect(s.selected).toBe('body-hoodie');
    expect(isPreviewDirty(EQUIPPED, s.preview)).toBe(false);
  });

  it('원래대로(전부 복원) = 빈 상태, 탭 이탈 초기화도 빈 상태', () => {
    expect(composePreview(EQUIPPED, EMPTY_PICK.preview)).toEqual(EQUIPPED);
    expect(isPreviewDirty(EQUIPPED, EMPTY_PICK.preview)).toBe(false);
  });

  it('착용이 바뀌어 미리보기와 같아지면 정리한다 (구매 직후)', () => {
    const s = pickItem(EMPTY_PICK, 'body-sweater', EQUIPPED);
    const after = equip(EQUIPPED, 'body-sweater', new Set([...OWNED, 'body-sweater']));
    expect(syncPreview(s.preview, after)).toEqual({});
  });
});

describe('그리드 순서', () => {
  it('처음 가진 옷 먼저, 그다음 가격 낮은 순', () => {
    expect(gridItems('head').map((i) => i.id)).toEqual(['head-beanie', 'head-catears', 'head-straw', 'head-headphones', 'head-wizard']);
    expect(gridItems('body')[0].id).toBe('body-hoodie');
  });

  it('슬롯의 모든 옷을 보여 준다', () => {
    expect(gridItems('back')).toHaveLength(4);
  });
});
