// 꾸미기 · 마을 모드의 미리보기 카드 (디자인 #31b). 시안의 섬 그림이 아니라 메인과 같은 장면 컴포넌트(VillageBackdrop)를
// 카드 크기로 줄여 쓴다: 지금 입은 옷을 입은 솔이 + 고른(또는 적용 중인) 배경 테마. 좌우는 장면이 BLEED만큼 더 그려져 있어 빈 데가 없다.
// 성능: 움직임은 모두 멈춘다 (active=false → 시계가 서 있다). 별 · 구름 · 나무는 처음 모습 그대로 정지하고, 메인에 돌아가면 다시 움직인다.
// 날씨는 'sun'(맑음)으로 고정한다 — 테마 색을 그대로 보이려는 것이다 (메인에서는 그날 날씨가 테마 위에 겹친다).

import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Equipped } from '../../domain/outfit';
import type { TimeOfDay } from '../../domain/types';
import { MAIN_SCENE } from '../features';
import { VillageBackdrop } from '../scene/VillageBackdrop';
import { resolveTheme } from '../scene/theme';
import { colors } from '../theme';

/** 장면에서 카드에 넣을 구간: 위 150 ~ 아래 630 (하늘 · 능선 · 뒤 줄 · 솔이 발까지). 480 높이를 카드 높이에 맞춰 줄인다 */
export const VILLAGE_PREVIEW_WINDOW = { top: 150, height: 480 } as const;

type Props = {
  width: number;
  height: number;
  radius: number;
  bgId: string;
  timeOfDay: TimeOfDay;
  /** 지금 입은 옷 (저장된 값) */
  equipped: Equipped;
  soliSkin?: string | null;
  /** 말풍선 · 원래대로 칩 등을 얹는다 */
  children?: ReactNode;
};

const ROW = {
  board: [],
  boardToday: false,
  lanternOn: false,
  bloom: 0.5,
  building: null,
  showHouseAndCreek: MAIN_SCENE.houseAndCreek,
  showBoard: MAIN_SCENE.board,
} as const;

export const VillagePreview = memo(function VillagePreview({ width, height, radius, bgId, timeOfDay, equipped, soliSkin = null, children }: Props) {
  const theme = useMemo(() => resolveTheme(bgId, timeOfDay), [bgId, timeOfDay]);
  const scale = height / VILLAGE_PREVIEW_WINDOW.height;
  const fit = useMemo(
    () => ({ scale, left: (width - 390 * scale) / 2, top: -VILLAGE_PREVIEW_WINDOW.top * scale }),
    [scale, width],
  );
  return (
    <View style={[styles.card, { width, height, borderRadius: radius, backgroundColor: theme.sky[0] }]}>
      <VillageBackdrop theme={theme} weather="sun" fit={fit} plots={NO_PLOTS} row={ROW} visitors={NO_VISITORS} equipped={equipped} soliSkin={soliSkin} active={false} />
      {children}
    </View>
  );
});

const NO_PLOTS: never[] = [];
const NO_VISITORS: never[] = [];

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: colors.cardSub },
});
