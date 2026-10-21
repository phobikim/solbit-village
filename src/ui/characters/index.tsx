// 캐릭터·그림을 react-native-svg의 SvgXml로 그리는 컴포넌트 모음.

import { memo, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { CropKind, Weather } from '../../domain/types';
import { cropIconSvg } from './crops';
import { bannerIconSvg, weatherIconSvg } from './icons';
import { ijangPropsOf, ijangSvg, type IjangMood } from './ijang';
import { buildingSvg } from './skins';
import { faceSvg, FACES, npcSvg, type NpcHair } from './neighbors';
import { soliSkinSvg, soliSvg, type SoliMood } from './soli';
import { wrap } from './svg';
import { VILLAGE_VIEWBOX, villageSceneSvg, villageSkyTop, type VillageSceneParams } from './village';

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

export function Ijang({ mood, prop, ...rest }: CharProps & { mood: IjangMood; prop?: string | null }) {
  const xml = useMemo(() => wrap(ijangSvg(mood, ijangPropsOf(prop ?? null))), [mood, prop]);
  return <Char xml={xml} {...rest} />;
}

export function Npc({ color, hair, sad, ...rest }: CharProps & { color: string; hair: NpcHair; sad?: boolean }) {
  const xml = useMemo(() => wrap(npcSvg(color, hair, sad)), [color, hair, sad]);
  return <Char xml={xml} {...rest} />;
}

/** 마을 건물 스킨 그림 */
export function Building({ id, ...rest }: CharProps & { id: string }) {
  const xml = useMemo(() => wrap(buildingSvg(id)), [id]);
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

/** 메인 마을 무대. 부모 크기를 채우고, 땅 쪽(아래)을 기준으로 맞춘다. 누르는 곳은 없다. */
export const VillageScene = memo(function VillageScene(scene: VillageSceneParams) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s && s.w === width && s.h === height ? s : { w: width, h: height }));
  };
  const fit = size && size.h / size.w > VILLAGE_VIEWBOX.height / VILLAGE_VIEWBOX.width ? 'meet' : 'slice';
  const xml = useMemo(() => villageSceneSvg(scene, fit), [scene, fit]);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: villageSkyTop(scene.timeOfDay) }]} onLayout={onLayout}>
      {size && <SvgXml xml={xml} width={size.w} height={size.h} />}
    </View>
  );
});
