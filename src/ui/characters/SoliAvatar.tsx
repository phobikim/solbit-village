// 솔이를 그리는 컴포넌트 하나. 기본 포즈(soli-pose-base) 위에 입은 옷을 겹쳐 그린다. 메인 장면 · 나 탭 프로필 · 꾸미기 미리보기 · 옷 칸 썸네일이 모두 이것을 쓴다.
// 겹침 순서는 src/domain/outfit.ts (outfitLayers = SPEC 17). 옷은 기본 포즈에서만 입힌다 (걷기 · 풍선 같은 다른 포즈에는 입히지 않는다).
// 표정(지침 / 보통 / 신남)은 그리지 않는다: 옷 합성 에셋이 기본 포즈 하나뿐이라 표정별 그림이 없다 (TODO: 표정별 기본 포즈 에셋이 오면 mood를 받는다).
// 입은 옷의 단일 출처는 src/state/outfit.ts (useOutfit.equipped) — 호출하는 쪽이 구독해서 equipped로 넘긴다.

import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { outfitLayers, type Equipped } from '../../domain/outfit';
import { CachedSvg } from './CachedSvg';
import { OUTFIT_ART, type CanvasBox } from './outfits';
import { soliSkinBackSvg, soliSkinSvg } from './soli';
import { SOLI_POSES, SOLI_POSE_VIEWBOX } from './soliPoses';

type Props = {
  equipped: Equipped;
  /**
   * 200×240 캔버스를 놓을 자리. 없으면 width만 보고 (0, 0)에 놓는다.
   * 바깥 View가 overflow를 자르게 하면 썸네일처럼 일부만 보여 줄 수 있다.
   */
  box: CanvasBox | { width: number };
  /** true면 솔이 없이 입은 옷만 그린다 (옷 가게 칸의 옷만 크롭) */
  itemsOnly?: boolean;
  /** 교환소에서 얻은 솔이 스킨 id (배낭 · 모자 …). 있으면 솔이 뒤 · 옷 위에 얹는다 (포즈 캔버스와 같은 좌표계) */
  skin?: string | null;
  style?: StyleProp<ViewStyle>;
};

const RATIO = SOLI_POSE_VIEWBOX.height / SOLI_POSE_VIEWBOX.width;

/** 스킨 그림(viewBox 0 0 200 220)을 포즈 캔버스(0 -20 200 240)에 그대로 얹는다 */
const skinXml = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -20 200 240">${inner}</svg>`;

export const SoliAvatar = memo(function SoliAvatar({ equipped, box, itemsOnly, skin, style }: Props) {
  const width = box.width;
  const height = 'height' in box ? box.height : width * RATIO;
  const left = 'left' in box ? box.left : 0;
  const top = 'top' in box ? box.top : 0;

  // 입은 옷이 같으면 같은 층을 다시 만들지 않는다
  const key = Object.entries(equipped)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([s, id]) => `${s}:${id}`)
    .join('|');
  const layers = useMemo(() => {
    const out: { key: string; xml: string }[] = [];
    const back = !itemsOnly && skin ? soliSkinBackSvg(skin) : '';
    if (back) out.push({ key: 'skin-back', xml: skinXml(back) });
    for (const l of outfitLayers(equipped)) {
      if (l.kind === 'soli') {
        if (!itemsOnly) out.push({ key: 'soli', xml: SOLI_POSES.base });
        continue;
      }
      const xml = OUTFIT_ART[l.id]?.[l.part];
      if (xml) out.push({ key: `${l.id}:${l.part}`, xml });
    }
    const front = !itemsOnly && skin ? soliSkinSvg(skin) : '';
    if (front) out.push({ key: 'skin-front', xml: skinXml(front) });
    return out;
    // equipped 대신 key를 본다 (같은 내용의 새 객체로는 다시 계산하지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, itemsOnly, skin]);

  return (
    <View style={[styles.root, style]} pointerEvents="none">
      {layers.map((l) => (
        <View key={l.key} style={{ position: 'absolute', left, top, width, height }}>
          <CachedSvg xml={l.xml} width={width} height={height} />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
});
