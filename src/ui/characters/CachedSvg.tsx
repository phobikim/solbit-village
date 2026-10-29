// SVG 문자열을 한 번만 파싱해서 쓴다. SvgXml은 컴포넌트마다 파싱하는데, 옷장은 같은 그림(기본 포즈 · 아이템)을
// 칸마다 다시 그려서 파싱이 낭비된다. 파싱 결과(AST)를 문자열별로 캐시하고 SvgAst로 그린다.

import { memo } from 'react';
import { parse, SvgAst } from 'react-native-svg';
import type { StyleProp, ViewStyle } from 'react-native';

type Ast = ReturnType<typeof parse>;

const cache = new Map<string, Ast>();

export function parsedSvg(xml: string): Ast {
  let ast = cache.get(xml);
  if (ast === undefined) {
    ast = parse(xml);
    cache.set(xml, ast);
  }
  return ast;
}

type Props = { xml: string; width: number; height: number; style?: StyleProp<ViewStyle> };

export const CachedSvg = memo(function CachedSvg({ xml, width, height, style }: Props) {
  return <SvgAst ast={parsedSvg(xml)} override={{ width, height, style }} />;
});
