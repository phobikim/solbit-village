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
import { LEGACY_SCENE_PCT } from '../layout';
import { villageSceneSvg, villageSkyTop, type VillageSceneParams } from './village';

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
 * 메인 마을 무대. 4:3 고정 — 너비 × 3/4 높이로 그린다 (잘림 · 좌우 여백 없음).
 * 누르는 곳은 게시판 하나 (장부로 가기). 기록을 입력하는 장치는 두지 않는다 (규칙 5).
 */
export const VillageScene = memo(function VillageScene({
  width,
  height,
  onBoardPress,
  ...scene
}: VillageSceneParams & { width: number; height: number; onBoardPress?: () => void }) {
  const xml = useMemo(() => villageSceneSvg(scene), [scene]);
  const hit = LEGACY_SCENE_PCT.boardHit;
  return (
    <View style={{ width, height, backgroundColor: villageSkyTop(scene.timeOfDay) }}>
      <SvgXml xml={xml} width={width} height={height} />
      {onBoardPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="마을 게시판 (장부 대소사)"
          onPress={onBoardPress}
          style={{
            position: 'absolute',
            left: (width * hit.x0) / 100,
            top: (height * hit.y0) / 100,
            width: (width * (hit.x1 - hit.x0)) / 100,
            height: (height * (hit.y1 - hit.y0)) / 100,
          }}
        />
      )}
    </View>
  );
});
