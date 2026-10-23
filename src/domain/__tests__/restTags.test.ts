import { addTag, isKnownPlace, recognizeTags, refreshTags, type TagContext } from '../restTags';

const ctx: TagContext = {
  neighbors: [
    { id: 'n1', name: '서연' },
    { id: 'n2', name: '민수' },
  ],
  places: ['한강', '속초 바다'],
};
const labels = (text: string, c: TagContext = ctx) => recognizeTags(text, c).map((t) => `${t.kind}:${t.label}`);

describe('태그 인식 (규칙 기반)', () => {
  it('디자인 15b의 예: 산책 · 서연 · 한강 · 떡볶이', () => {
    expect(labels('퇴근하고 서연이랑 한강 걷다가 떡볶이 먹음')).toEqual([
      'neighbor:서연',
      'place:한강',
      'activity:산책',
      'etc:떡볶이',
    ]);
  });
  it('이웃 태그는 이웃 id를 들고 있다', () => {
    expect(recognizeTags('민수랑 영화', ctx)).toEqual([
      { kind: 'neighbor', label: '민수', ref: 'n2' },
      { kind: 'activity', label: '영화' },
    ]);
  });
  it('활동 사전: 산책 · 운동 · 영화 · 휴식 …', () => {
    expect(labels('집에서 낮잠')).toEqual(['activity:휴식']);
    expect(labels('헬스 갔다가 수영')).toEqual(['activity:운동']);
    expect(labels('영화 한 편')).toEqual(['activity:영화']);
    expect(labels('동네 산책')).toEqual(['activity:산책']);
  });
  it('기타 사전: 음식 등은 글에 나온 말 그대로', () => {
    expect(labels('치킨에 맥주')).toEqual(['etc:치킨', 'etc:맥주']);
  });
  it('장소는 띄어쓰기가 달라도 찾는다 (보따리 이름으로 보여 준다)', () => {
    expect(recognizeTags('속초바다 보고 왔다', ctx)).toEqual([{ kind: 'place', label: '속초 바다' }]);
  });
  it('이름이 한 글자인 이웃은 잡지 않는다 (다른 말과 헷갈림)', () => {
    expect(labels('나랑 놀았다', { neighbors: [{ id: 'x', name: '나' }], places: [] })).toEqual([]);
  });
  it('못 알아들으면 태그 없음 · 같은 태그는 한 번만', () => {
    expect(labels('그냥 좋았다')).toEqual([]);
    expect(labels('산책하고 또 산책하고 걸었다')).toEqual(['activity:산책']);
  });
  it('이미 잡은 글자와 겹치는 말은 건너뛴다 (장소 이름 안의 말)', () => {
    const c: TagContext = { neighbors: [], places: ['영화의 전당'] };
    expect(labels('영화의 전당 구경', c)).toEqual(['place:영화의 전당']);
  });
  it('태그는 최대 8개', () => {
    const many = ['치킨', '피자', '라면', '삼겹살', '파스타', '햄버거', '초밥', '국밥', '족발'].join(' ');
    expect(recognizeTags(many, ctx)).toHaveLength(8);
  });
});

describe('태그 고치기', () => {
  it('x로 뺀 태그는 글을 더 적어도 되살아나지 않는다', () => {
    const removed = [{ kind: 'etc' as const, label: '떡볶이' }];
    expect(refreshTags('한강 걷다가 떡볶이 먹음', ctx, removed, []).map((t) => t.label)).toEqual(['한강', '산책']);
    expect(refreshTags('한강 걷다가 떡볶이 먹고 또 떡볶이', ctx, removed, []).map((t) => t.label)).toEqual(['한강', '산책']);
  });
  it('[+ 장소]로 직접 넣은 태그는 글에 없어도 남는다', () => {
    const manual = [{ kind: 'place' as const, label: '남산' }];
    expect(refreshTags('걷다가', ctx, [], manual).map((t) => `${t.kind}:${t.label}`)).toEqual(['activity:산책', 'place:남산']);
  });
  it('addTag: 같은 태그는 그대로, 공백 정리, 이름 길이 제한', () => {
    const tags = addTag([], { kind: 'place', label: '  남산  ' });
    expect(tags).toEqual([{ kind: 'place', label: '남산' }]);
    expect(addTag(tags, { kind: 'place', label: '남산' })).toHaveLength(1);
    expect(addTag(tags, { kind: 'place', label: '   ' })).toHaveLength(1);
    expect(addTag([], { kind: 'place', label: '가'.repeat(30) })[0].label).toHaveLength(12);
  });
  it('보따리에 있는 장소인가', () => {
    expect(isKnownPlace('속초바다', ctx.places)).toBe(true);
    expect(isKnownPlace('남산', ctx.places)).toBe(false);
  });
});
