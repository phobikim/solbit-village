// 기록 시트 "누구와": 자주 연락하는 이웃 6명 + "다른 이웃" 검색, 고른 이웃마다 연락 방식.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { NeighborWithStats } from '../../../data/neighbors';
import { frequentNeighbors } from '../../../domain/neighbors';
import type { Contact, ContactMethod } from '../../../domain/types';
import { Face } from '../../characters';
import { NEIGHBOR_COLORS } from '../../characters/neighbors';
import { colors, fonts } from '../../theme';
import { Avatar } from '../Avatar';

const METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'call', label: '통화' },
  { value: 'meet', label: '만남' },
  { value: 'message', label: '메시지' },
];

const plus = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${colors.textSub}" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;

type Props = {
  neighbors: NeighborWithStats[];
  value: Contact[];
  onChange: (v: Contact[]) => void;
};

export function NeighborPicker({ neighbors, value, onChange }: Props) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const selected = new Set(value.map((c) => c.neighborId));
  const byId = useMemo(() => new Map(neighbors.map((n) => [n.id, n])), [neighbors]);

  // 바로 보이는 줄: 자주 연락하는 이웃 + (그 밖에서) 고른 이웃
  const quick = useMemo(() => {
    const f = frequentNeighbors(neighbors);
    const ids = new Set(f.map((n) => n.id));
    const extra = value.map((c) => byId.get(c.neighborId)).filter((n): n is NeighborWithStats => !!n && !ids.has(n.id));
    return [...f, ...extra];
  }, [neighbors, value, byId]);

  const toggle = (id: string) =>
    onChange(selected.has(id) ? value.filter((c) => c.neighborId !== id) : [...value, { neighborId: id, method: 'meet' }]);
  const setMethod = (id: string, method: ContactMethod) =>
    onChange(value.map((c) => (c.neighborId === id ? { ...c, method } : c)));

  const results = query.trim()
    ? neighbors.filter((n) => n.name.includes(query.trim()) && !quick.some((q) => q.id === n.id))
    : neighbors.filter((n) => !quick.some((q) => q.id === n.id));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {quick.map((n) => {
          const on = selected.has(n.id);
          return (
            <Pressable
              key={n.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={n.name}
              onPress={() => toggle(n.id)}
              style={styles.person}
            >
              <Avatar size={42} background={NEIGHBOR_COLORS[n.color] ?? colors.night} style={on && styles.ring}>
                <Face face={n.face} size={38} />
              </Avatar>
              <Text style={[styles.name, on && styles.nameOn]} numberOfLines={1}>
                {n.name}
              </Text>
            </Pressable>
          );
        })}
        {neighbors.length > quick.length && (
          <Pressable accessibilityRole="button" onPress={() => setSearching((s) => !s)} style={styles.person}>
            <View style={styles.more}>
              <SvgXml xml={plus} width={16} height={16} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              다른 이웃
            </Text>
          </Pressable>
        )}
      </View>

      {searching && (
        <View style={styles.search}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="이름으로 찾기"
            placeholderTextColor={colors.tabInactive}
            style={styles.searchInput}
          />
          <View style={styles.results}>
            {results.length === 0 ? (
              <Text style={styles.noResult}>찾는 이웃이 없습니다.</Text>
            ) : (
              results.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => {
                    toggle(n.id);
                    setQuery('');
                    setSearching(false);
                  }}
                  style={styles.result}
                >
                  <Text style={styles.resultText}>{n.name}</Text>
                </Pressable>
              ))
            )}
          </View>
        </View>
      )}

      {value.map((c) => {
        const n = byId.get(c.neighborId);
        if (!n) return null;
        return (
          <View key={c.neighborId} style={styles.methodRow}>
            <Text style={styles.methodWho} numberOfLines={1}>
              {n.name} 씨와
            </Text>
            {METHODS.map((m) => {
              const on = c.method === m.value;
              return (
                <Pressable
                  key={m.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setMethod(c.neighborId, m.value)}
                  style={[styles.method, on && styles.methodOn]}
                >
                  <Text style={[styles.methodText, on && styles.methodTextOn]}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  person: { width: 46, alignItems: 'center', gap: 4 },
  ring: { borderWidth: 3, borderColor: colors.relation },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
  nameOn: { color: colors.relation },
  more: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.disabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: { backgroundColor: colors.night, borderRadius: 20, padding: 8, gap: 6 },
  searchInput: {
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  results: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  result: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card, justifyContent: 'center' },
  resultText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  noResult: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, padding: 4 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.night,
    borderRadius: 20,
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 12,
  },
  methodWho: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.relation },
  method: { height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.card, justifyContent: 'center' },
  methodOn: { backgroundColor: colors.relation },
  methodText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  methodTextOn: { color: colors.line },
});
