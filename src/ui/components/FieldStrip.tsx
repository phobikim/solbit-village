// 밭 띠 (메인, 장면 밖): 5칸 가로, 칸마다 작물 성장 그림 + 작은 상태 글자.
// 기본 72pt / 압축 56pt (글자 숨김). 누르는 곳은 없다 (규칙 5).

import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CROP_NAME, PLOT_EMPTY_LABEL, PLOT_STAGE_LABEL } from '../../copy/crops.ko';
import type { PlotSlot, TimeOfDay } from '../../domain/types';
import { FIELD_CELL, fieldCellSvg } from '../characters/fieldStrip';
import { colors, fonts, radius } from '../theme';

type Props = {
  plots: readonly PlotSlot[];
  time: TimeOfDay;
  height: number;
  /** 칸마다 상태 글자 (압축에서는 숨김) */
  labels: boolean;
};

const GAP = 6;
const LABEL_H = 14;

export const FieldStrip = memo(function FieldStrip({ plots, time, height, labels }: Props) {
  const xmls = useMemo(() => Array.from({ length: 5 }, (_, i) => fieldCellSvg(plots[i] ?? null, time)), [plots, time]);
  // 그림은 칸 높이(글자 자리 제외)에 맞춰 키우고 가로는 가운데
  const art = height - 12 - (labels ? LABEL_H : 0);
  const artW = Math.round((art * FIELD_CELL.width) / FIELD_CELL.height);
  return (
    <View style={[styles.row, { height }]} accessibilityLabel="밭 5칸">
      {xmls.map((xml, i) => {
        const slot = plots[i] ?? null;
        const text = slot ? PLOT_STAGE_LABEL[slot.stage] : PLOT_EMPTY_LABEL;
        return (
          <View
            key={i}
            style={styles.cell}
            accessibilityLabel={slot ? `${CROP_NAME[slot.crop]} ${text}` : '빈 밭'}
          >
            <SvgXml xml={xml} width={artW} height={art} />
            {labels && (
              <Text style={[styles.label, slot?.stage === 3 && styles.labelRipe]} numberOfLines={1}>
                {text}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, backgroundColor: colors.cardSub, borderRadius: radius.index, paddingHorizontal: 6, paddingVertical: 6 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 11, lineHeight: LABEL_H, color: colors.textSub },
  labelRipe: { color: colors.yellow },
});
