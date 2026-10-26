// 이장 방송 라인. 모든 탭 헤더 바로 아래, 같은 자리·같은 모양 (SPEC 9장).

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { equippedSkin } from '../../domain/harvest';
import { useSkins } from '../../state/ledger';
import { Ijang } from '../characters';
import { megaphoneSvg } from '../characters/icons';
import { colors, fonts, radius } from '../theme';

type Props = {
  message: string;
  /** "21:40" 형식 */
  time: string;
  /** 방송 끝에 붙는 버튼 (예: 수확할 작물이 있을 때만 [수확하기]) */
  action?: { label: string; onPress: () => void };
  /** 메인 화면: 높이를 고정한다 (layout.ts). 넘치는 글은 말줄임, 탭하면 펼침 (장면 위에 겹쳐 뜬다) */
  fixed?: { height: number; lines: 1 | 2 };
};

const megaphone = megaphoneSvg(colors.line);

export function BroadcastLine({ message, time, action, fixed }: Props) {
  // 이장 소품 스킨을 쓰고 있으면 방송 아바타에도 보인다
  const prop = useSkins((s) => equippedSkin('ijang', s.equipped));
  const [open, setOpen] = useState(false);
  if (fixed) {
    const one = fixed.lines === 1;
    const avatar = one ? 30 : 40;
    return (
      <View style={[styles.fixedSlot, { height: fixed.height }, open && styles.fixedOpen]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`마을 방송 ${time}. ${message}`}
          accessibilityHint="누르면 전체를 펼치거나 접습니다"
          onPress={() => setOpen((o) => !o)}
          style={[styles.card, styles.fixedCard, open ? styles.fixedCardOpen : { height: fixed.height }, one && styles.fixedCardOne]}
        >
          <View style={{ width: avatar, height: avatar, borderRadius: avatar / 2, backgroundColor: colors.yellow, overflow: 'hidden', alignItems: 'center' }}>
            <Ijang mood="base" prop={prop} size={avatar} style={{ marginTop: 1 }} />
          </View>
          <View style={styles.body}>
            {!one && (
              <View style={styles.meta}>
                <Text style={styles.label}>마을 방송</Text>
                <Text style={styles.time}>{time}</Text>
              </View>
            )}
            <Text style={styles.fixedMessage} numberOfLines={open ? undefined : fixed.lines}>
              {message}
            </Text>
          </View>
          {one && <Text style={styles.time}>{time}</Text>}
        </Pressable>
      </View>
    );
  }
  return (
    // 버튼이 있으면 묶지 않아야 버튼에 따로 닿는다
    <View style={styles.card} accessible={!action} accessibilityLabel={action ? undefined : `마을 방송 ${time}. ${message}`}>
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Ijang mood="base" prop={prop} size={46} style={styles.avatarImg} />
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
        {action && (
          <Pressable accessibilityRole="button" onPress={action.onPress} style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
            <Text style={styles.actionText}>{action.label}</Text>
          </Pressable>
        )}
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
  action: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: colors.yellow,
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderBottomWidth: 3,
    borderBottomColor: '#C9A800',
  },
  actionPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 1 },
  actionText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.line },
  // 메인 고정 높이 변형
  fixedSlot: { marginHorizontal: 12, zIndex: 1 },
  fixedOpen: { zIndex: 20, elevation: 20 },
  fixedCard: { marginHorizontal: 0, paddingVertical: 8, paddingHorizontal: 12, gap: 10, alignItems: 'center' },
  fixedCardOne: { paddingVertical: 6 },
  fixedCardOpen: { position: 'absolute', left: 0, right: 0, top: 0, minHeight: 44 },
  fixedMessage: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 18, color: colors.text },
});
