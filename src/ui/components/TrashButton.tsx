// 정리 모드에서 줄 끝에 붙는 휴지통 (디자인 13a · 13b)

import { Pressable, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors } from '../theme';

const TRASH = `<svg viewBox="0 0 24 24" fill="none" stroke="${colors.pink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5"/></svg>`;

export function TrashButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} 지우기`} onPress={onPress} style={styles.btn}>
      <SvgXml xml={TRASH} width={18} height={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.night,
    borderWidth: 2,
    borderColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
