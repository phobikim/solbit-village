// 마을 보상표 바텀시트 (디자인 v5 26d). 아래에서 올라오고, 열릴 때 현재 레벨 줄이 목록 가운데에 오도록 스크롤한다.
// 닫기: X · 스크림 탭 · 위쪽(손잡이 · 제목 · 레벨 카드)을 아래로 끌기 · 안드로이드 뒤로가기.
// 보여 주는 값은 모두 도메인(rewards.ts)이 계산한 확정 금액처럼 쓴다. 경험치 수치는 보이지 않는다.

import { useCallback, useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import {
  REWARD_CURRENT,
  REWARD_HEUNG_LABEL,
  REWARD_FUTURE,
  REWARD_MILESTONE,
  REWARD_PAST,
  REWARD_COIN_LABEL,
  REWARD_SHEET_CLOSE,
  REWARD_SHEET_TITLE,
  rewardLevelTitle,
  rewardNextLabel,
  rewardProgressA11y,
  rewardRowA11y,
  UNLOCK_NAME,
  UNLOCK_NONE,
} from '../../copy/rewards.ko';
import { rewardRow, rewardStatus, rewardTableLevels, type RewardRow, type RewardStatus } from '../../domain/rewards';
import { ICON_COIN, ICON_HEUNG, ICON_TROPHY } from '../characters/rewardIcons';
import { APP_MAX_WIDTH } from '../layout';
import { colors, fonts } from '../theme';
import { CheckGlyph, CloseGlyph, LockGlyph, UnlockGlyph } from './unlockIcons';

const SHEET_BG = '#1A2150';
const SHEET_RATIO = 0.85;
/** 이만큼 끌거나 이 속도(px/ms)로 쓸면 닫는다 */
const CLOSE_DRAG = 110;
const CLOSE_FLING = 0.9;
const OPEN_MS = 380;
const CLOSE_MS = 260;
const OPEN_EASE = Easing.bezier(0.2, 0.9, 0.3, 1);

// 줄 색 (시안): 지난 / 지금 / 앞으로
const TONE: Record<RewardStatus, { bg: string; ink: string; badgeBg: string; badgeInk: string; chipBg: string; inner: string; iconOp: number }> = {
  past: { bg: '#2B3470', ink: colors.text, badgeBg: '#3A437F', badgeInk: colors.text, chipBg: colors.cardSub, inner: colors.card, iconOp: 1 },
  current: { bg: colors.yellow, ink: colors.line, badgeBg: colors.line, badgeInk: colors.yellow, chipBg: '#FFF3A8', inner: '#FFF3A8', iconOp: 1 },
  future: { bg: colors.cardMuted, ink: colors.textMuted, badgeBg: colors.card, badgeInk: colors.textMuted, chipBg: colors.night, inner: colors.night, iconOp: 0.5 },
};

const STATUS_LABEL: Record<RewardStatus, string> = { past: REWARD_PAST, current: REWARD_CURRENT, future: REWARD_FUTURE };

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 화면에 들어온 시점의 마을 레벨 */
  level: number;
  /** 다음 레벨까지 진행률 0~1 */
  progress: number;
};

export function VillageRewardSheet({ visible, onClose, level, progress }: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetH = Math.round(winH * SHEET_RATIO);
  const sheetW = Math.min(winW, APP_MAX_WIDTH);

  // 닫는 애니메이션이 끝날 때까지 Modal을 남겨 둔다
  const [mounted, setMounted] = useState(visible);
  const ty = useSharedValue(sheetH);
  const scrim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      ty.value = sheetH;
      ty.value = withTiming(0, { duration: OPEN_MS, easing: OPEN_EASE });
      scrim.value = withTiming(1, { duration: 300 });
      return;
    }
    ty.value = withTiming(sheetH, { duration: CLOSE_MS, easing: Easing.in(Easing.quad) });
    scrim.value = withTiming(0, { duration: CLOSE_MS });
    const id = setTimeout(() => setMounted(false), CLOSE_MS + 40);
    return () => clearTimeout(id);
  }, [visible, sheetH, ty, scrim]);

  useEffect(() => () => {
    cancelAnimation(ty);
    cancelAnimation(scrim);
  }, [ty, scrim]);

  // 위쪽을 아래로 끌어 닫기 (목록 스크롤과 겹치지 않게 목록 밖 영역에만 붙인다)
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          ty.value = Math.max(0, g.dy);
          scrim.value = Math.max(0, 1 - g.dy / sheetH);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > CLOSE_DRAG || g.vy > CLOSE_FLING) {
            onClose();
          } else {
            ty.value = withSpring(0, { damping: 20, stiffness: 220 });
            scrim.value = withTiming(1, { duration: 150 });
          }
        },
        onPanResponderTerminate: () => {
          ty.value = withSpring(0, { damping: 20, stiffness: 220 });
          scrim.value = withTiming(1, { duration: 150 });
        },
      }),
    [ty, scrim, sheetH, onClose],
  );

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  const levels = useMemo(() => rewardTableLevels(level).map(rewardRow), [level]);

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={REWARD_SHEET_CLOSE} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { height: sheetH, width: sheetW }, sheetStyle]} accessibilityViewIsModal>
          <View {...pan.panHandlers}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title} accessibilityRole="header">
                {REWARD_SHEET_TITLE}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel={REWARD_SHEET_CLOSE} onPress={onClose} style={styles.close}>
                <CloseGlyph size={16} color={colors.text} />
              </Pressable>
            </View>
            <LevelCard level={level} progress={progress} />
          </View>
          <RewardList levels={levels} currentLevel={level} bottomInset={insets.bottom} />
        </Animated.View>
      </View>
    </Modal>
  );
}

function LevelCard({ level, progress }: { level: number; progress: number }) {
  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHead}>
        <SvgXml xml={ICON_TROPHY} width={32} height={32} />
        <Text style={styles.levelTitle}>{rewardLevelTitle(level)}</Text>
      </View>
      <View style={styles.levelBarRow}>
        <View style={styles.bar} accessible accessibilityRole="progressbar" accessibilityLabel={rewardProgressA11y(level)}>
          <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.levelNext}>{rewardNextLabel(level)}</Text>
      </View>
    </View>
  );
}

/** 목록: 모든 줄이 한 번 그려진 뒤 현재 레벨 줄을 가운데로 (줄 높이가 달라서 onLayout으로 잰다) */
function RewardList({ levels, currentLevel, bottomInset }: { levels: RewardRow[]; currentLevel: number; bottomInset: number }) {
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  const listH = useRef(0);
  const cur = useRef<{ y: number; h: number } | null>(null);
  const done = useRef(false);

  const tryCenter = useCallback(() => {
    if (done.current || !cur.current || listH.current <= 0) return;
    done.current = true;
    const { y, h } = cur.current;
    scroll.current?.scrollTo({ y: Math.max(0, y - (listH.current - h) / 2), animated: false });
  }, []);

  return (
    <ScrollView
      ref={scroll}
      style={styles.list}
      contentContainerStyle={[styles.listContent, { paddingBottom: 40 + bottomInset }]}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => {
        listH.current = e.nativeEvent.layout.height;
        tryCenter();
      }}
    >
      {levels.map((row) => {
        const status = rewardStatus(row.level, currentLevel);
        const isCur = status === 'current';
        return (
          <View
            key={row.level}
            onLayout={
              isCur
                ? (e) => {
                    cur.current = { y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height };
                    tryCenter();
                  }
                : undefined
            }
          >
            {row.milestone ? <MilestoneCard row={row} status={status} /> : <RewardRowCard row={row} status={status} />}
          </View>
        );
      })}
    </ScrollView>
  );
}

function rowLabel(row: RewardRow, status: RewardStatus): string {
  return rewardRowA11y(row.level, row.salary, row.heung, row.unlock ? UNLOCK_NAME[row.unlock.id] : UNLOCK_NONE, STATUS_LABEL[status]);
}

/** 지금 레벨은 카드 바깥에 어두운 틈 + 노랑 테두리가 한 겹 더 둘린다 (시안: box-shadow 0 0 0 3px #1A2150, 0 0 0 6px #FFE14D) */
function Ring({ on, radius, children }: { on: boolean; radius: number; children: React.ReactNode }) {
  if (!on) return <>{children}</>;
  return <View style={[styles.ring, { borderRadius: radius + 6 }]}>{children}</View>;
}

function Badge({ row, status, big }: { row: RewardRow; status: RewardStatus; big: boolean }) {
  const t = TONE[status];
  const s = big ? 52 : 44;
  return (
    <View style={[styles.badge, { width: s, height: s, borderRadius: big ? 16 : 14, backgroundColor: t.badgeBg }]}>
      <Text style={[styles.badgeLv, { color: t.badgeInk, fontSize: big ? 10 : 9 }]}>Lv</Text>
      <Text style={[styles.badgeNum, { color: t.badgeInk, fontSize: big ? 22 : 18 }]}>{row.level}</Text>
      {status === 'past' && (
        <View style={[styles.check, big ? styles.checkBig : null]}>
          <CheckGlyph size={big ? 12 : 11} />
        </View>
      )}
    </View>
  );
}

function Chips({ row, status, big }: { row: RewardRow; status: RewardStatus; big: boolean }) {
  const t = TONE[status];
  const icon = big ? 22 : 20;
  const chip = [styles.chip, { backgroundColor: t.chipBg, height: big ? 30 : 28, borderRadius: big ? 15 : 14 }];
  const num = [styles.chipNum, { color: t.ink, fontSize: big ? 16 : 15 }];
  return (
    <View style={[styles.chips, { gap: big ? 6 : 5 }]}>
      <View style={chip} accessible accessibilityLabel={`${REWARD_COIN_LABEL} ${row.salary}`}>
        <View style={{ opacity: t.iconOp }}>
          <SvgXml xml={ICON_COIN} width={icon} height={icon} />
        </View>
        <Text style={num}>{row.salary}</Text>
      </View>
      <View style={chip} accessible accessibilityLabel={`${REWARD_HEUNG_LABEL} +${row.heung}`}>
        <View style={{ opacity: t.iconOp }}>
          <SvgXml xml={ICON_HEUNG} width={icon} height={icon} />
        </View>
        <Text style={num}>+{row.heung}</Text>
      </View>
    </View>
  );
}

function RewardRowCard({ row, status }: { row: RewardRow; status: RewardStatus }) {
  const t = TONE[status];
  const name = row.unlock ? UNLOCK_NAME[row.unlock.id] : UNLOCK_NONE;
  return (
    <Ring on={status === 'current'} radius={20}>
      <View style={[styles.row, { backgroundColor: t.bg }]} accessible accessibilityLabel={rowLabel(row, status)}>
        <Badge row={row} status={status} big={false} />
        <Chips row={row} status={status} big={false} />
        <View style={styles.rowRight}>
          <Text style={[styles.rowName, { color: t.ink }]}>{name}</Text>
          {row.unlock && <UnlockGlyph icon={row.unlock.icon} size={26} opacity={t.iconOp} />}
          {status === 'future' && <LockGlyph size={16} />}
        </View>
      </View>
    </Ring>
  );
}

function MilestoneCard({ row, status }: { row: RewardRow; status: RewardStatus }) {
  const t = TONE[status];
  const name = row.unlock ? UNLOCK_NAME[row.unlock.id] : UNLOCK_NONE;
  return (
    <Ring on={status === 'current'} radius={24}>
      <View style={[styles.mile, { backgroundColor: t.bg }]} accessible accessibilityLabel={`${REWARD_MILESTONE}, ${rowLabel(row, status)}`}>
        <View style={styles.mileTop}>
          <Badge row={row} status={status} big />
          <Chips row={row} status={status} big />
          <View style={[styles.special, { opacity: t.iconOp }]}>
            <Text style={styles.specialText}>{REWARD_MILESTONE}</Text>
          </View>
        </View>
        <View style={[styles.mileInner, { backgroundColor: t.inner }]}>
          <UnlockGlyph icon={row.unlock?.icon ?? 'gift'} size={36} opacity={t.iconOp} />
          <Text style={[styles.mileName, { color: t.ink }]}>{name}</Text>
          {status === 'future' && <LockGlyph size={18} />}
        </View>
      </View>
    </Ring>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { backgroundColor: 'rgba(6,9,28,0.62)' },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.disabled },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, paddingBottom: 12, paddingLeft: 20, paddingRight: 16 },
  title: { fontFamily: fonts.title, fontSize: 26, color: colors.yellow },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },

  levelCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18, gap: 12 },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelTitle: { fontFamily: fonts.title, fontSize: 30, lineHeight: 34, color: colors.text },
  levelBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bar: { flex: 1, height: 14, borderRadius: 7, backgroundColor: colors.night, borderWidth: 2, borderColor: colors.line, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 7, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.line },
  levelNext: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },

  list: { flex: 1 },
  listContent: { paddingTop: 16, paddingHorizontal: 16, gap: 10 },

  ring: { margin: -6, padding: 3, borderWidth: 3, borderColor: colors.yellow, backgroundColor: SHEET_BG },
  row: { minHeight: 64, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRight: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  rowName: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 17, textAlign: 'right' },

  badge: { alignItems: 'center', justifyContent: 'center' },
  badgeLv: { fontFamily: fonts.bodyHeavy, lineHeight: 11 },
  badgeNum: { fontFamily: fonts.numberBold, lineHeight: 24 },
  check: {
    position: 'absolute',
    left: -6,
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.relation,
    borderWidth: 2.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBig: { width: 22, height: 22, borderRadius: 11 },

  chips: { flexDirection: 'row' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 3, paddingRight: 8 },
  chipNum: { fontFamily: fonts.number },

  mile: { borderRadius: 24, padding: 14, gap: 12 },
  mileTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  special: { marginLeft: 'auto', backgroundColor: colors.pink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  specialText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.line },
  mileInner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12 },
  mileName: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 15, lineHeight: 20 },
});
