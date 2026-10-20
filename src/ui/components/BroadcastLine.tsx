// 이장 방송 라인. 모든 탭 헤더 바로 아래, 같은 자리·같은 모양 (SPEC 9장).

import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Ijang } from '../characters';
import { megaphoneSvg } from '../characters/icons';
import { colors, fonts, radius } from '../theme';

type Props = {
  message: string;
  /** "21:40" 형식 */
  time: string;
};

const megaphone = megaphoneSvg(colors.line);

export function BroadcastLine({ message, time }: Props) {
  return (
    <View style={styles.card} accessibilityRole="text" accessibilityLabel={`마을 방송 ${time}. ${message}`}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ijang mood="base" size={46} style={styles.avatarImg} />
        </View>
        <View style={styles.badge}>
          <SvgXml xml={megaphone} width={11} height={11} />
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.meta}>
          <Text style={styles.label}>마을 방송</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  avatarWrap: { width: 44, height: 44 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellow,
    overflow: 'hidden',
    alignItems: 'center',
  },
  avatarImg: { marginTop: 2 },
  badge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  body: { flex: 1, gap: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.yellow },
  time: { fontFamily: fonts.number, fontSize: 12, color: colors.textMuted },
  message: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.text },
});
