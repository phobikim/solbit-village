// 아직 없는 옷의 실루엣: 그림의 색을 한 가지로 칠한다. 순수 문자열 함수.
// <mask> 안의 흰색 · 검정은 가리는 용도라 그대로 둔다 (칠하면 마스크가 깨진다).

const COLOR_ATTR = /\b(fill|stroke)="(#[0-9a-fA-F]{3,8}|white|black)"/g;

export function silhouetteSvg(xml: string, color: string): string {
  return xml
    .split(/(<mask[\s\S]*?<\/mask>)/)
    .map((part) => (part.startsWith('<mask') ? part : part.replace(COLOR_ATTR, `$1="${color}"`)))
    .join('');
}
