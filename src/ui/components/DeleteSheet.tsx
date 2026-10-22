// 지우기 확인 시트 (디자인 13c): 무엇을 지우는지 · 이장 한마디 · 놔두기 / 지우기

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { DELETE_GO, DELETE_KEEP } from '../../copy/tidy.ko';
import { Ijang } from '../characters';
import { colors, fonts } from '../theme';

type Props = {
  visible: boolean;
  /** 왼쪽 동그라미 안 그림 (이웃 얼굴 · 행사 아이콘) */
  art: ReactNode;
  title: string;
  sub: string;
  line: string;
  onKeep: () => void;
  onDelete: () => Promise<void>;
};

export function DeleteSheet({ visible, art, title, sub, line, onKeep, onDelete }: Props) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (e) {
      console.warn('[delete] failed', e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onKeep}>
      <Pressable style={styles.dim} onPress={onKeep}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.art}>{art}</View>
            <View style={styles.headText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.sub}>{sub}</Text>
            </View>
          </View>
          <View style={styles.bubbleRow}>
            <Ijang mood="base" size={46} />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{line}</Text>
            </View>
          </View>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" onPress={onKeep} style={[styles.btn, styles.keep]}>
              <Text style={styles.keepText}>{DELETE_KEEP}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={go} disabled={busy} style={[styles.btn, styles.del]}>
              <Text style={styles.delText}>{DELETE_GO}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(6,8,24,.7)', justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: colors.cardSub,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 16,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A437F', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  art: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  headText: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  sub: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSub },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  bubbleText: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 20, color: colors.line },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  keep: { backgroundColor: colors.track },
  keepText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  del: { backgroundColor: colors.pink, borderBottomWidth: 4, borderBottomColor: '#B32A6E' },
  delText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.line },
});
