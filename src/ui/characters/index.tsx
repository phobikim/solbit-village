// 캐릭터·그림을 react-native-svg의 SvgXml로 그리는 컴포넌트 모음.

import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { CropKind, Weather } from '../../domain/types';
import { cropIconSvg } from './crops';
import { bannerIconSvg, weatherIconSvg } from './icons';
import { ijangSvg, type IjangMood } from './ijang';
import { faceSvg, FACES, npcSvg, type NpcHair } from './neighbors';
import { soliSkinSvg, soliSvg, type SoliMood } from './soli';
import { wrap } from './svg';
import { PLOT_HIT, PLOT_X, VILLAGE_VIEWBOX, villageSceneSvg, villageSkyTop, type VillageSceneParams } from './village';

export type { IjangMood, NpcHair, SoliMood, VillageSceneParams };

type CharProps = { size: number; style?: StyleProp<ViewStyle> };

/** 200x220 캐릭터: size는 너비 */
const Char = memo(function Char({ xml, size, style }: CharProps & { xml: string }) {
  return <SvgXml xml={xml} width={size} height={size * 1.1} style={style} />;
});

export function Soli({ mood, skin, ...rest }: CharProps & { mood: SoliMood; skin?: string | null }) {
  const xml = useMemo(() => wrap(soliSvg(mood) + soliSkinSvg(skin ?? null)), [mood, skin]);
  return <Char xml={xml} {...rest} />;
}

export function Ijang({ mood, ...rest }: CharProps & { mood: IjangMood }) {
  const xml = useMemo(() => wrap(ijangSvg(mood)), [mood]);
  return <Char xml={xml} {...rest} />;
}

export function Npc({ color, hair, sad, ...rest }: CharProps & { color: string; hair: NpcHair; sad?: boolean }) {
  const xml = useMemo(() => wrap(npcSvg(color, hair, sad)), [color, hair, sad]);
  return <Char xml={xml} {...rest} />;
}

/** 이웃 등록 얼굴 (face 0-11) */
export function Face({ face, ...rest }: CharProps & { face: number }) {
  const xml = useMemo(() => wrap(faceSvg(FACES[face] ?? FACES[0])), [face]);
  return <Char xml={xml} {...rest} />;
}

type IconProps = { size: number; style?: StyleProp<ViewStyle> };

export function CropIcon({ crop, size, style }: IconProps & { crop: CropKind }) {
  const xml = useMemo(() => cropIconSvg(crop), [crop]);
  return <SvgXml xml={xml} width={size} height={size} style={style} />;
}

export function WeatherIcon({ weather, size, style }: IconProps & { weather: Weather }) {
  const xml = useMemo(() => weatherIconSvg(weather), [weather]);
  return <SvgXml xml={xml} width={size} height={size} style={style} />;
}

export function BannerIcon({ color, pole, size, style }: IconProps & { color: string; pole?: string }) {
  const xml = useMemo(() => bannerIconSvg(color, pole), [color, pole]);
  return <SvgXml xml={xml} width={size} height={size} style={style} />;
}

type VillageSceneProps = {
  scene: VillageSceneParams;
  /** 익은 작물이 있는 칸 (탭하면 수확) */
  ripeSlots?: readonly number[];
  onRipePress?: () => void;
};

/**
 * 메인 마을 무대. 부모 크기를 채우고, 땅 쪽(아래)을 기준으로 맞춘다.
 * 익은 작물 칸만 눌러서 수확할 수 있다 (수확은 기록 입력이 아니다 — CLAUDE.md 규칙 5).
 */
export const VillageScene = memo(function VillageScene({ scene, ripeSlots = [], onRipePress }: VillageSceneProps) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s && s.w === width && s.h === height ? s : { w: width, h: height }));
  };
  const fit = size && size.h / size.w > VILLAGE_VIEWBOX.height / VILLAGE_VIEWBOX.width ? 'meet' : 'slice';
  const xml = useMemo(() => villageSceneSvg(scene, fit), [scene, fit]);

  // viewBox 좌표 → 화면 좌표 (xMidYMax meet|slice)
  const hit = useMemo(() => {
    if (!size || !onRipePress) return [];
    const k =
      fit === 'meet'
        ? Math.min(size.w / VILLAGE_VIEWBOX.width, size.h / VILLAGE_VIEWBOX.height)
        : Math.max(size.w / VILLAGE_VIEWBOX.width, size.h / VILLAGE_VIEWBOX.height);
    const ox = (size.w - VILLAGE_VIEWBOX.width * k) / 2;
    const oy = size.h - VILLAGE_VIEWBOX.height * k;
    return ripeSlots.map((slot) => ({
      slot,
      left: ox + PLOT_X[slot] * k,
      top: oy + PLOT_HIT.top * k,
      width: PLOT_HIT.width * k,
      height: (PLOT_HIT.bottom - PLOT_HIT.top) * k,
    }));
  }, [size, fit, ripeSlots, onRipePress]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: villageSkyTop(scene.timeOfDay) }]} onLayout={onLayout}>
      {size && <SvgXml xml={xml} width={size.w} height={size.h} />}
      {hit.map((h) => (
        <Pressable
          key={h.slot}
          accessibilityRole="button"
          accessibilityLabel="익은 작물 수확하기"
          onPress={onRipePress}
          hitSlop={6}
          style={{ position: 'absolute', left: h.left, top: h.top, width: h.width, height: h.height }}
        />
      ))}
    </View>
  );
});
