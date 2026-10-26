// 캐릭터·그림을 react-native-svg의 SvgXml로 그리는 컴포넌트 모음.

import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { EventType } from '../../domain/events';
import type { CropKind, Weather } from '../../domain/types';
import { cropIconSvg } from './crops';
import { eventIconSvg } from './eventIcons';
import { bannerIconSvg, weatherIconSvg } from './icons';
import { ijangSvg, type IjangMood } from './ijang';
import { buildingSvg } from './skins';
import { faceSvg, FACES, npcSvg, type NpcHair } from './neighbors';
import { soliWithSkinSvg, type SoliMood } from './soli';
import { wrap } from './svg';
import { sceneGeometry } from '../layout';
import { BOARD_RECT, villageSceneSvg, villageSkyTop, type VillageSceneParams } from './village';

export type { IjangMood, NpcHair, SoliMood, VillageSceneParams };

type CharProps = { size: number; style?: StyleProp<ViewStyle> };

/** 200x220 캐릭터: size는 너비 */
const Char = memo(function Char({ xml, size, style }: CharProps & { xml: string }) {
  return <SvgXml xml={xml} width={size} height={size * 1.1} style={style} />;
});

export function Soli({ mood, skin, ...rest }: CharProps & { mood: SoliMood; skin?: string | null }) {
  const xml = useMemo(() => wrap(soliWithSkinSvg(mood, skin ?? null)), [mood, skin]);
  return <Char xml={xml} {...rest} />;
}

export function Ijang({ mood, prop, ...rest }: CharProps & { mood: IjangMood; prop?: string | null }) {
  const xml = useMemo(() => wrap(ijangSvg(mood, prop ?? null)), [mood, prop]);
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

/** 행사 분류 아이콘 (small: 24px 이하용 단순한 모양) */
export function EventIcon({ type, small, size, style }: IconProps & { type: EventType; small?: boolean }) {
  const xml = useMemo(() => eventIconSvg(type, small ?? size <= 28), [type, small, size]);
  return <SvgXml xml={xml} width={size} height={size} style={style} />;
}

export function BannerIcon({ color, pole, size, style }: IconProps & { color: string; pole?: string }) {
  const xml = useMemo(() => bannerIconSvg(color, pole), [color, pole]);
  return <SvgXml xml={xml} width={size} height={size} style={style} />;
}

/**
 * 메인 마을 무대. 부모 크기를 채우고, 땅 쪽(아래)을 기준으로 맞춘다.
 * 누르는 곳은 게시판 하나 (장부로 가기). 기록을 입력하는 장치는 두지 않는다 (규칙 5).
 */
export const VillageScene = memo(function VillageScene({
  onBoardPress,
  ...scene
}: VillageSceneParams & { onBoardPress?: () => void }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((s) => (s && s.w === width && s.h === height ? s : { w: width, h: height }));
  };
  // 땅 쪽 층은 장면 너비 기준 비율로 아래에 붙고, 늘어나는 높이는 하늘만 흡수한다 (layout.ts)
  const geo = useMemo(() => (size ? sceneGeometry(size.w, size.h) : null), [size]);
  const xml = useMemo(() => (geo ? villageSceneSvg(scene, geo) : ''), [scene, geo]);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: villageSkyTop(scene.timeOfDay) }]} onLayout={onLayout}>
      {size && xml !== '' && <SvgXml xml={xml} width={size.w} height={size.h} />}
      {size && geo && onBoardPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="마을 게시판 (장부 대소사)"
          onPress={onBoardPress}
          style={{
            position: 'absolute',
            left: (BOARD_RECT.x - geo.viewBox.x) * geo.k,
            top: (BOARD_RECT.y - geo.viewBox.y) * geo.k,
            width: BOARD_RECT.width * geo.k,
            height: BOARD_RECT.height * geo.k,
          }}
        />
      )}
    </View>
  );
});
