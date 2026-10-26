// 장작 던지기 태그 인식 (디자인 v8 15b). 규칙 기반 — 서버 · AI 없음.
// 활동·기타는 사전, 이웃은 등록된 이름, 장소는 보따리 장소 이름에서 찾는다.

import { REST_TAGS_MAX, REST_TAG_LABEL_MAX, type RestTag } from './fire';

/** 활동 사전: 태그 이름 → 글에서 찾을 말 */
export const ACTIVITY_WORDS: Readonly<Record<string, readonly string[]>> = {
  산책: ['산책', '걷', '걸었', '걸으'],
  운동: ['운동', '헬스', '러닝', '달리기', '조깅', '요가', '필라테스', '수영', '등산', '자전거', '클라이밍'],
  영화: ['영화', '극장'],
  휴식: ['휴식', '낮잠', '뒹굴', '늘어져', '멍때', '멍 때', '누워'],
  독서: ['독서', '책 읽', '책을 읽'],
  게임: ['게임'],
  드라이브: ['드라이브'],
  캠핑: ['캠핑'],
  목욕: ['목욕', '반신욕', '사우나', '온천'],
  외식: ['외식', '식당', '맛집'],
  카페: ['카페'],
  쇼핑: ['쇼핑'],
  공연: ['공연', '콘서트', '전시'],
};

/** 기타 사전 (음식 등): 글에 나온 그대로 태그가 된다 */
export const ETC_WORDS: readonly string[] = [
  '떡볶이', '치킨', '피자', '라면', '삼겹살', '파스타', '햄버거', '초밥', '국밥', '족발', '곱창', '냉면', '김밥', '샐러드', '빵', '케이크',
  '커피', '맥주', '소주', '와인', '막걸리', '술', '디저트',
];

const stripSpaces = (s: string) => s.replace(/\s+/g, '');

type Span = [number, number];
const overlaps = (a: Span, b: Span) => a[0] < b[1] && b[0] < a[1];

export type TagContext = {
  neighbors: readonly { id: string; name: string }[];
  /** 보따리(깃발 · 발자국) 장소 이름 */
  places: readonly string[];
};

/**
 * 한 줄 → 태그. 이웃 > 장소 > 활동 > 기타 순으로 찾고, 이미 잡힌 글자와 겹치는 말은 건너뛴다.
 * 결과는 글에 나온 순서. 같은 태그는 한 번만.
 */
export function recognizeTags(text: string, ctx: TagContext): RestTag[] {
  const found: { at: number; tag: RestTag }[] = [];
  const taken: Span[] = [];
  const add = (at: number, len: number, tag: RestTag) => {
    const span: Span = [at, at + len];
    if (taken.some((t) => overlaps(t, span))) return;
    if (found.some((f) => f.tag.kind === tag.kind && f.tag.label === tag.label && f.tag.ref === tag.ref)) return;
    taken.push(span);
    found.push({ at, tag });
  };

  // 이웃: 이름 두 글자 이상 (한 글자 이름은 다른 말과 헷갈려 잡지 않는다)
  for (const n of ctx.neighbors) {
    const name = n.name.trim();
    if (name.length < 2) continue;
    const at = text.indexOf(name);
    if (at >= 0) add(at, name.length, { kind: 'neighbor', label: name, ref: n.id });
  }
  // 장소: 띄어쓰기 달라도 찾는다 (글자 위치는 공백 없는 글 기준을 원문 위치로 되돌린다)
  const flat = stripSpaces(text);
  const back: number[] = [];
  for (let i = 0; i < text.length; i++) if (!/\s/.test(text[i])) back.push(i);
  for (const p of ctx.places) {
    const key = stripSpaces(p);
    if (key.length < 2) continue;
    const at = flat.indexOf(key);
    if (at >= 0) add(back[at], back[at + key.length - 1] - back[at] + 1, { kind: 'place', label: p.trim() });
  }
  for (const [label, words] of Object.entries(ACTIVITY_WORDS)) {
    for (const w of words) {
      const at = text.indexOf(w);
      if (at >= 0) {
        add(at, w.length, { kind: 'activity', label });
        break;
      }
    }
  }
  for (const w of ETC_WORDS) {
    const at = text.indexOf(w);
    if (at >= 0) add(at, w.length, { kind: 'etc', label: w });
  }

  return found
    .sort((a, b) => a.at - b.at)
    .map((f) => f.tag)
    .slice(0, REST_TAGS_MAX);
}

/** 태그를 직접 더하기 ([+ 장소] 등). 같은 태그면 그대로. */
export function addTag(tags: readonly RestTag[], tag: RestTag): RestTag[] {
  const label = tag.label.trim().slice(0, REST_TAG_LABEL_MAX);
  if (!label || tags.length >= REST_TAGS_MAX) return [...tags];
  if (tags.some((t) => t.kind === tag.kind && t.label === label && t.ref === tag.ref)) return [...tags];
  return [...tags, { ...tag, label }];
}

/** 글을 고치면 태그를 다시 읽되, 사용자가 뺀 태그는 되살리지 않고 직접 넣은 태그는 남긴다. */
export function refreshTags(
  text: string,
  ctx: TagContext,
  removed: readonly RestTag[],
  manual: readonly RestTag[],
): RestTag[] {
  const same = (a: RestTag, b: RestTag) => a.kind === b.kind && a.label === b.label && a.ref === b.ref;
  let tags = recognizeTags(text, ctx).filter((t) => !removed.some((r) => same(r, t)));
  for (const m of manual) tags = addTag(tags, m);
  return tags;
}

/** 새 장소 태그가 보따리에 이미 있는 장소인가 (띄어쓰기 무시) */
export function isKnownPlace(label: string, places: readonly string[]): boolean {
  const k = stripSpaces(label);
  return places.some((p) => stripSpaces(p) === k);
}
