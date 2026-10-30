// 지갑 알약: [코인 칸] | 구분선 | [흥 칸] (디자인 TURN 30).
// hud = 메인 오른쪽 위(높이 44, 칸을 누를 수 있다) / header = 옷장 헤더(높이 36, 누를 수 없다).
// 잔액은 src/state/wallet.ts 에서 읽기만 한다. 코인 칸은 솔이 옷장으로, 흥 칸은 마을 행사로 가야 하지만 그 화면이 아직 없다.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import { CURRENCY_COIN, CURRENCY_HEUNG, WALLET_COIN_A11Y, WALLET_HEUNG_A11Y } from '../../copy/wallet.ko';
import { formatCount } from '../../domain/wallet';
import { useWallet } from '../../state/wallet';
import { ICON_COIN, ICON_HEUNG } from '../characters/rewardIcons';
import { colors, fonts } from '../theme';

type Props = {
  variant: 'hud' | 'header';
  /** 코인 칸을 누르면 (hud만) */
  onCoinPress?: () => void;
  /** 흥 칸을 누르면. 없으면 꺾쇠를 숨기고 누름 효과도 없다 */
  onHeungPress?: () => void;
};

const SIZE = {
  hud: { height: 44, radius: 22, icon: 26, num: 15, border: 2.5, bg: 'rgba(30,37,88,0.86)' },
  header: { height: 36, radius: 18, icon: 22, num: 15, border: 2.5, bg: '#232B60' },
} as const;

export function WalletPill({ variant, onCoinPress, onHeungPress }: Props) {
  const coin = useWallet((s) => s.coin);
  const heung = useWallet((s) => s.heung);
  const S = SIZE[variant];
  return (
    <View style={[styles.pill, { height: S.height, borderRadius: S.radius, backgroundColor: S.bg, borderWidth: S.border }]}>
      <Cell
        xml={ICON_COIN}
        size={S.icon}
        num={S.num}
        value={coin}
        padding={{ paddingLeft: 4, paddingRight: variant === 'hud' ? 8 : 10 }}
        label={onCoinPress ? WALLET_COIN_A11Y : `${CURRENCY_COIN} ${formatCount(coin)}`}
        onPress={onCoinPress}
      />
      <View style={styles.divider} />
      <Cell
        xml={ICON_HEUNG}
        size={S.icon}
        num={S.num}
        value={heung}
        padding={{ paddingLeft: 5, paddingRight: 10 }}
        label={variant === 'hud' ? WALLET_HEUNG_A11Y : `${CURRENCY_HEUNG} ${formatCount(heung)}`}
        // TODO(route: 마을 행사): 화면이 생기면 onHeungPress를 넘기고 꺾쇠를 켠다
        onPress={onHeungPress}
      />
    </View>
  );
}

function Cell({
  xml,
  size,
  num,
  value,
  padding,
  label,
  onPress,
}: {
  xml: string;
  size: number;
  num: number;
  value: number;
  padding: { paddingLeft: number; paddingRight: number };
  label: string;
  onPress?: () => void;
}) {
  const body = (
    <>
      <SvgXml xml={xml} width={size} height={size} />
      <Text style={[styles.num, { fontSize: num }]}>{formatCount(value)}</Text>
      {onPress && (
        <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 5l7 7-7 7" />
        </Svg>
      )}
    </>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={[styles.cell, padding]}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.cell, padding, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', borderColor: colors.line, overflow: 'hidden' },
  cell: { height: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 },
  pressed: { backgroundColor: '#2B3370' },
  divider: { width: 2, height: 22, borderRadius: 1, backgroundColor: '#3A4386' },
  num: { fontFamily: fonts.numberBold, color: colors.text },
});
