// 재화 칩 2개: [코인 아이콘 + 잔액] [흥 아이콘 + 잔액] (디자인 TURN 27 · 28). 마을 탭과 옷장 탭의 맨 위에만 둔다.
// 눌러도 동작은 없다. 잔액은 src/state/wallet.ts 에서 읽기만 한다.

import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CURRENCY_COIN, CURRENCY_HEUNG } from '../../copy/wallet.ko';
import { formatCount } from '../../domain/wallet';
import { useWallet } from '../../state/wallet';
import { ICON_COIN, ICON_HEUNG } from '../characters/rewardIcons';
import { colors, fonts } from '../theme';

export const CHIP_HEIGHT = 36;

export function CurrencyChips() {
  const coin = useWallet((s) => s.coin);
  const heung = useWallet((s) => s.heung);
  return (
    <View style={styles.row}>
      <Chip xml={ICON_COIN} label={CURRENCY_COIN} value={coin} />
      <Chip xml={ICON_HEUNG} label={CURRENCY_HEUNG} value={heung} />
    </View>
  );
}

function Chip({ xml, label, value }: { xml: string; label: string; value: number }) {
  return (
    <View style={styles.chip} accessible accessibilityLabel={`${label} ${formatCount(value)}`}>
      <SvgXml xml={xml} width={24} height={24} />
      <Text style={styles.num}>{formatCount(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    height: CHIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(30,37,88,0.86)',
    borderWidth: 2.5,
    borderColor: colors.line,
  },
  num: { fontFamily: fonts.numberBold, fontSize: 16, color: colors.text },
});
