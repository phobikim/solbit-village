// 기본 포즈 솔이 + 입은 옷을 겹쳐 그린다. 옷장 미리보기와 칸 썸네일이 함께 쓴다.
// 겹침 순서는 src/domain/outfit.ts (outfitLayers). 지금은 기본 포즈에서만 입힌다.

import { memo, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { outfitLayers, type Equipped } from '../../domain/outfit';
import { CachedSvg } from './CachedSvg';
import { OUTFIT_ART, type CanvasBox } from './outfits';
import { silhouetteSvg } from './outfits/silhouette';
import { SOLI_POSES, SOLI_POSE_VIEWBOX } from './soliPoses';

type Props = {
  equipped: Equipped;
  /**
   * 200×240 캔버스를 놓을 자리. 없으면 width만 보고 (0, 0)에 놓는다.
   * 바깥 View가 overflow를 자르게 하면 썸네일처럼 일부만 보여 줄 수 있다.
   */
  box: CanvasBox | { width: number };
  /** true면 솔이 없이 입은 옷만 한 색 실루엣으로 (아직 없는 옷) */
  silhouette?: string;
  style?: StyleProp<ViewStyle>;
};

const RATIO = SOLI_POSE_VIEWBOX.height / SOLI_POSE_VIEWBOX.width;

export const SoliOutfit = memo(function SoliOutfit({ equipped, box, silhouette, style }: Props) {
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
    for (const l of outfitLayers(equipped)) {
      if (l.kind === 'soli') {
        if (!silhouette) out.push({ key: 'soli', xml: SOLI_POSES.base });
        continue;
      }
      const xml = OUTFIT_ART[l.id]?.[l.part];
      if (xml) out.push({ key: `${l.id}:${l.part}`, xml: silhouette ? silhouetteSvg(xml, silhouette) : xml });
    }
    return out;
    // equipped 대신 key를 본다 (같은 내용의 새 객체로는 다시 계산하지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, silhouette]);

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
