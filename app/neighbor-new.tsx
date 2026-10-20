// 9f 이웃 등록 시트. ?id= 가 있으면 고치기 (목록에서 내리기 포함).
// 휴대폰 주소록 연동은 하지 않는다 (SPEC 7장).

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ijangLines } from '../src/copy/broadcasts.ko';
import { FREQUENCY_LABEL, RELATION_LABEL, type Relation } from '../src/copy/labels.ko';
import { archiveNeighbor, insertNeighbor, newNeighborId, updateNeighbor, type Frequency } from '../src/data/neighbors';
import { NEIGHBOR_NAME_MAX } from '../src/domain/neighbors';
import { useNeighbors } from '../src/state/neighbors';
import { Face } from '../src/ui/characters';
import { FACES, NEIGHBOR_COLORS } from '../src/ui/characters/neighbors';
import { ChoiceChips } from '../src/ui/components/form';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { Field, FieldLabel, IjangBubble } from '../src/ui/components/record/pickers';
import { colors, fonts } from '../src/ui/theme';

const RELATIONS = (Object.keys(RELATION_LABEL) as Relation[]).map((value) => ({ value, label: RELATION_LABEL[value] }));
const FREQUENCIES = (Object.keys(FREQUENCY_LABEL) as Frequency[]).map((value) => ({ value, label: FREQUENCY_LABEL[value] }));

export default function NeighborNew() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const list = useNeighbors((s) => s.list);
  const load = useNeighbors((s) => s.load);
  const editing = id ? list.find((n) => n.id === id) : undefined;

  const [face, setFace] = useState(0);
  const [color, setColor] = useState(3);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<Relation | null>(null);
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setFace(editing.face);
    setColor(editing.color);
    setName(editing.name);
    setRelation(editing.relation);
    setFrequency(editing.frequency);
  }, [editing]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/neighbors'));
  const ready = name.trim().length > 0 && relation !== null && frequency !== null;

  const onSave = async () => {
    if (!ready || saving) return;
    setSaving(true);
    try {
      const base = { name: name.trim().slice(0, NEIGHBOR_NAME_MAX), face, color, relation, frequency };
      if (editing) await updateNeighbor({ id: editing.id, ...base });
      else await insertNeighbor({ id: newNeighborId(), createdAt: Date.now(), ...base });
      await load();
      close();
    } catch (e) {
      console.warn('[neighbor] save failed', e);
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!editing) return;
    if (!confirmArchive) return setConfirmArchive(true);
    await archiveNeighbor(editing.id);
    await load();
    close();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <View style={styles.handle} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" indicatorStyle="white">
          <IjangBubble text={editing ? ijangLines.neighborEdit : ijangLines.neighborNew} />
          <Text style={styles.title}>{editing ? '이웃 정보' : '새 이웃'}</Text>

          <View style={styles.section}>
            <FieldLabel>얼굴</FieldLabel>
            <View style={styles.faces}>
              {FACES.map((_, i) => {
                const on = i === face;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`얼굴 ${i + 1}`}
                    onPress={() => setFace(i)}
                    style={[styles.face, { backgroundColor: on ? NEIGHBOR_COLORS[color] : colors.night }, on && styles.faceOn]}
                  >
                    <Face face={i} size={52} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <FieldLabel>배경색</FieldLabel>
            <View style={styles.swatches}>
              {NEIGHBOR_COLORS.map((c, i) => (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: i === color }}
                  accessibilityLabel={`배경색 ${i + 1}`}
                  onPress={() => setColor(i)}
                  style={[styles.swatch, { backgroundColor: c }, i === color && styles.swatchOn]}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <FieldLabel>이름</FieldLabel>
            <Field value={name} onChangeText={setName} placeholder="이웃 이름" maxLength={NEIGHBOR_NAME_MAX} />
          </View>

          <View style={styles.section}>
            <FieldLabel>관계</FieldLabel>
            <ChoiceChips options={RELATIONS} value={relation} onChange={setRelation} />
          </View>

          <View style={styles.section}>
            <FieldLabel>연락 주기</FieldLabel>
            <ChoiceChips options={FREQUENCIES} value={frequency} onChange={setFrequency} />
          </View>

          {editing && (
            <View style={styles.archive}>
              {confirmArchive && <Text style={styles.archiveHint}>{ijangLines.neighborArchiveConfirm}</Text>}
              <Text style={styles.archiveBtn} onPress={onArchive} accessibilityRole="button">
                {confirmArchive ? '네, 목록에서 내리기' : '목록에서 내리기'}
              </Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label={saving ? '저장 중…' : editing ? '고치기' : '이웃 등록하기'}
            onPress={onSave}
            disabled={!ready || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cardSub },
  flex: { flex: 1 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#3A437F', alignSelf: 'center', marginTop: 10 },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, gap: 12 },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  section: { gap: 6 },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  face: { width: '22.5%', aspectRatio: 1.1, borderRadius: 16, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  faceOn: { borderWidth: 3, borderColor: colors.yellow },
  swatches: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchOn: { borderWidth: 3, borderColor: colors.text },
  archive: { alignItems: 'center', gap: 6, marginTop: 8 },
  archiveHint: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub, textAlign: 'center' },
  archiveBtn: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted, padding: 6 },
  footer: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
});
