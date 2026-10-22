// 7c 이웃. 가까운 순, 단짝, 맨 아래 "안부 묻기 좋은 이웃" (SPEC 7장).
// 정리(13a): 줄 끝 휴지통 → 확인 시트(13c) → 이웃과 연락 기록을 지운다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { broadcasts } from '../../src/copy/broadcasts.ko';
import { ASK_AFTER_TITLE, RELATION_LABEL } from '../../src/copy/labels.ko';
import { DELETE_NEIGHBOR_LINE, deleteNeighborTitle } from '../../src/copy/tidy.ko';
import { deleteNeighbor } from '../../src/data/neighbors';
import { today as getToday, yearMonthOf } from '../../src/domain/day';
import { useNeighbors } from '../../src/state/neighbors';
import { useRecords } from '../../src/state/records';
import { useNeighborsView } from '../../src/state/tabViews';
import { Face } from '../../src/ui/characters';
import { NEIGHBOR_COLORS } from '../../src/ui/characters/neighbors';
import { Avatar } from '../../src/ui/components/Avatar';
import { DeleteSheet } from '../../src/ui/components/DeleteSheet';
import { NeighborCard } from '../../src/ui/components/NeighborCard';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { Screen } from '../../src/ui/components/Screen';
import { TidyButton } from '../../src/ui/components/TidyButton';
import { colors, fonts } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function NeighborsScreen() {
  const today = getToday();
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadMonth = useRecords((s) => s.loadMonth);
  const v = useNeighborsView(today);
  const [tidyMode, setTidy] = useState(false);
  // 다 지워서 이웃이 없으면 정리 모드도 끝난다
  const tidy = tidyMode && v.total > 0;
  const [deleting, setDeleting] = useState<(typeof v.listed)[number] | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadNeighbors(), loadMonth(yearMonthOf(today), true)]).catch((e) =>
        console.warn('[neighbors] load failed', e),
      );
    }, [loadNeighbors, loadMonth, today]),
  );

  const addNeighbor = () => router.push('/neighbor-new');
  const openNeighbor = (id: string) => router.push({ pathname: '/neighbor-new', params: { id } });

  const right = (
    <View style={styles.headerRight}>
      <Text style={styles.sortText}>
        가까운 순 · <Text style={styles.sortNum}>{v.total}</Text>명
      </Text>
      {v.total > 0 && <TidyButton on={tidy} onPress={() => setTidy(!tidy)} />}
      {!tidy && <RoundButton icon="plus" size={40} accessibilityLabel="이웃 등록" onPress={addNeighbor} />}
    </View>
  );

  return (
    <Screen title="이웃" broadcast={{ message: v.broadcast, time: timeLabel(new Date()) }} right={right}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {v.listed.map((n) => (
          <NeighborCard key={n.id} {...n} onPress={tidy ? undefined : () => openNeighbor(n.id)} onDelete={tidy ? () => setDeleting(n) : undefined} />
        ))}

        {v.askAfter.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{ASK_AFTER_TITLE}</Text>
            {v.askAfter.map((n) => (
              <View key={n.id} style={styles.askCard} onTouchEnd={() => openNeighbor(n.id)}>
                <Avatar size={44} background={NEIGHBOR_COLORS[n.color] ?? colors.card}>
                  <Face face={n.face} size={40} />
                </Avatar>
                <View style={styles.askBody}>
                  <Text style={styles.askName}>
                    {n.name} <Text style={styles.askRel}>{RELATION_LABEL[n.relation]}</Text>
                  </Text>
                  <Text style={styles.askText}>{broadcasts.askAfter(n.name)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {v.total === 0 && <Text style={styles.empty}>오른쪽 위 + 로 이웃을 등록해 보세요.</Text>}
      </ScrollView>

      <DeleteSheet
        visible={!!deleting}
        art={deleting && <Face face={deleting.face} size={48} />}
        title={deleting ? deleteNeighborTitle(deleting.name) : ''}
        sub={deleting ? `${RELATION_LABEL[deleting.relation]} · 이번 달 ${deleting.monthCount}번 만남` : ''}
        line={DELETE_NEIGHBOR_LINE}
        onKeep={() => setDeleting(null)}
        onDelete={async () => {
          if (!deleting) return;
          await deleteNeighbor(deleting.id);
          setDeleting(null);
          await Promise.all([loadNeighbors(), loadMonth(yearMonthOf(today), true)]);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sortText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  sortNum: { fontFamily: fonts.number, color: colors.text },
  content: { padding: 12, gap: 8, paddingBottom: 24 },
  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingLeft: 4 },
  askCard: {
    backgroundColor: colors.cardMuted,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  askBody: { flex: 1, gap: 3 },
  askName: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  askRel: { fontSize: 11, color: colors.textMuted },
  askText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textSub },
  empty: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 32 },
});
