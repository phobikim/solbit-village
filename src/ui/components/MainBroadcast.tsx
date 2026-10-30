// 메인의 방송띠 (디자인 TURN 30). HUD 아래에 얹히고, 기본은 접힘 — 누를 때마다 접었다 폈다 한다.
// 접힘: 높이 42 알약 + 이장 아바타 30 + 한 줄(말줄임) + 아래 꺾쇠. 펼침: 아바타 40 + "마을 방송" + 시각 + 전문 + 위 꺾쇠.
// 펼침 상태는 이 화면 안에서만 유지하고 저장하지 않는다.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { equippedSkin } from '../../domain/harvest';
import { useSkins } from '../../state/ledger';
import { Ijang } from '../characters';
import { MAIN_HUD } from '../mainScene';
import { colors, fonts } from '../theme';

type Props = {
  message: string;
  /** 방송을 보여 주는 시점의 "HH:mm" */
  time: string;
};

export function MainBroadcast({ message, time }: Props) {
  const prop = useSkins((s) => equippedSkin('ijang', s.equipped));
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`마을 방송 ${time}. ${message}`}
      accessibilityState={{ expanded: open }}
      accessibilityHint="누르면 전체를 펼치거나 접습니다"
      onPress={() => setOpen((o) => !o)}
      style={open ? styles.open : styles.closed}
    >
      <View style={open ? styles.avatarOpen : styles.avatarClosed}>
        <Ijang mood="base" prop={prop} size={open ? 42 : 32} style={{ marginTop: open ? 2 : 1 }} />
      </View>
      {open ? (
        <View style={styles.body}>
          <View style={styles.meta}>
            <Text style={styles.label}>마을 방송</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={styles.full}>{message}</Text>
        </View>
      ) : (
        <Text style={styles.one} numberOfLines={1}>
          {message}
        </Text>
      )}
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textSub} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" style={open ? styles.chevronOpen : undefined}>
        <Path d={open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closed: {
    marginTop: MAIN_HUD.broadcastGap,
    marginHorizontal: MAIN_HUD.side,
    height: MAIN_HUD.broadcastClosed,
    borderRadius: 21,
    borderWidth: 2.5,
    borderColor: colors.line,
    backgroundColor: 'rgba(35,43,96,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 5,
    paddingRight: 12,
  },
  open: {
    marginTop: MAIN_HUD.broadcastGap,
    marginHorizontal: MAIN_HUD.side,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: colors.line,
    backgroundColor: 'rgba(35,43,96,0.94)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  avatarClosed: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.yellow, overflow: 'hidden', alignItems: 'center' },
  avatarOpen: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.yellow, overflow: 'hidden', alignItems: 'center' },
  one: { flex: 1, minWidth: 0, fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  body: { flex: 1, minWidth: 0, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.yellow },
  time: { fontFamily: fonts.numberBold, fontSize: 12, color: colors.textMuted },
  full: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.text },
  chevronOpen: { marginTop: 2 },
});
