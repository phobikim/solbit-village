// 설정: 아침 소식 알림 시각 · 백업 내보내기/가져오기 (SPEC 11장)

import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { withPrefix } from '../src/copy/broadcasts.ko';
import {
  ALARM_DENIED,
  ALARM_DESC,
  ALARM_SECTION,
  ALARM_WEB,
  BACKUP_DESC,
  BACKUP_DONE_EXPORT,
  BACKUP_DONE_IMPORT,
  BACKUP_ERROR,
  BACKUP_EXPORT,
  BACKUP_IMPORT,
  BACKUP_IMPORT_CONFIRM,
  BACKUP_IMPORT_GO,
  BACKUP_SECTION,
  SETTINGS_BROADCAST,
  SETTINGS_TITLE,
} from '../src/copy/settings.ko';
import { exportBackupJson, restoreBackup } from '../src/data/backup';
import { pickBackupText, shareBackupFile } from '../src/data/backupFile';
import { backupFileName } from '../src/data/backupFormat';
import { getSetting, setSetting, SETTING } from '../src/data/settings';
import { today as getToday } from '../src/domain/day';
import { formatAlarmTime, NEWS_ALARM_STEP_MIN, parseAlarmTime, shiftAlarmTime } from '../src/domain/news';
import {
  cancelMorningNews,
  notificationsSupported,
  requestNotificationPermission,
  scheduleMorningNews,
} from '../src/notifications';
import { useFarm } from '../src/state/farm';
import { useLedger, useSkins } from '../src/state/ledger';
import { useNeighbors } from '../src/state/neighbors';
import { useRecords } from '../src/state/records';
import { SubScreen } from '../src/ui/components/form';
import { RoundButton } from '../src/ui/components/RoundButton';
import { colors, fonts } from '../src/ui/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function Settings() {
  const [alarmOn, setAlarmOn] = useState(false);
  const [time, setTime] = useState(() => parseAlarmTime(null));
  const [note, setNote] = useState<string | null>(null);
  const [confirmImport, setConfirmImport] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setAlarmOn((await getSetting(SETTING.newsAlarmOn)) === '1');
      setTime(parseAlarmTime(await getSetting(SETTING.newsAlarmTime)));
    })().catch((e) => console.warn('[settings] load failed', e));
  }, []);

  const applyAlarm = async (on: boolean, t: { hour: number; minute: number }) => {
    if (on && !(await requestNotificationPermission())) {
      setNote(ALARM_DENIED);
      on = false;
    }
    setAlarmOn(on);
    setTime(t);
    await setSetting(SETTING.newsAlarmOn, on ? '1' : '0');
    await setSetting(SETTING.newsAlarmTime, formatAlarmTime(t));
    if (on) await scheduleMorningNews(t.hour, t.minute);
    else await cancelMorningNews();
  };

  const onExport = async () => {
    setBusy(true);
    setNote(null);
    try {
      await shareBackupFile(await exportBackupJson(), backupFileName(getToday()));
      setNote(BACKUP_DONE_EXPORT);
    } catch (e) {
      console.warn('[backup] export failed', e);
      setNote(BACKUP_ERROR.failed);
    } finally {
      setBusy(false);
    }
  };

  const onPick = async () => {
    setNote(null);
    try {
      const text = await pickBackupText();
      if (text !== null) setConfirmImport(text);
    } catch (e) {
      console.warn('[backup] pick failed', e);
      setNote(BACKUP_ERROR.failed);
    }
  };

  const onRestore = async () => {
    if (!confirmImport) return;
    setBusy(true);
    try {
      const r = await restoreBackup(confirmImport);
      if (!r.ok) {
        setNote(BACKUP_ERROR[r.reason]);
        return;
      }
      // 읽어 둔 값을 모두 새로
      useRecords.getState().reset();
      await Promise.all([
        useFarm.getState().load(),
        useNeighbors.getState().load(),
        useLedger.getState().load(),
        useSkins.getState().load(),
      ]);
      // 알림 설정도 백업 값으로 맞춘다
      const on = (await getSetting(SETTING.newsAlarmOn)) === '1';
      const t = parseAlarmTime(await getSetting(SETTING.newsAlarmTime));
      setAlarmOn(on);
      setTime(t);
      if (on) await scheduleMorningNews(t.hour, t.minute);
      else await cancelMorningNews();
      setNote(BACKUP_DONE_IMPORT);
    } catch (e) {
      console.warn('[backup] restore failed', e);
      setNote(BACKUP_ERROR.failed);
    } finally {
      setConfirmImport(null);
      setBusy(false);
    }
  };

  return (
    <SubScreen title={SETTINGS_TITLE} broadcast={{ message: withPrefix(SETTINGS_BROADCAST), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{ALARM_SECTION}</Text>
            <Switch
              value={alarmOn}
              disabled={!notificationsSupported}
              onValueChange={(v) => applyAlarm(v, time).catch((e) => console.warn('[alarm]', e))}
              trackColor={{ true: colors.pink, false: colors.track }}
              thumbColor={colors.text}
            />
          </View>
          <Text style={styles.desc}>{notificationsSupported ? ALARM_DESC : ALARM_WEB}</Text>
          <View style={[styles.timeRow, !alarmOn && styles.dimmed]}>
            <RoundButton
              icon="prev"
              variant="card"
              size={36}
              disabled={!alarmOn}
              accessibilityLabel={`${NEWS_ALARM_STEP_MIN}분 앞으로`}
              onPress={() => applyAlarm(true, shiftAlarmTime(time, -NEWS_ALARM_STEP_MIN))}
            />
            <Text style={styles.time}>{formatAlarmTime(time)}</Text>
            <RoundButton
              icon="next"
              variant="card"
              size={36}
              disabled={!alarmOn}
              accessibilityLabel={`${NEWS_ALARM_STEP_MIN}분 뒤로`}
              onPress={() => applyAlarm(true, shiftAlarmTime(time, NEWS_ALARM_STEP_MIN))}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{BACKUP_SECTION}</Text>
          <Text style={styles.desc}>{BACKUP_DESC}</Text>
          <Pressable disabled={busy} onPress={onExport} style={[styles.btn, busy && styles.dimmed]}>
            <Text style={styles.btnText}>{BACKUP_EXPORT}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={onPick} style={[styles.btn, styles.btnSub, busy && styles.dimmed]}>
            <Text style={[styles.btnText, { color: colors.text }]}>{BACKUP_IMPORT}</Text>
          </Pressable>
          {confirmImport && (
            <View style={styles.confirm}>
              <Text style={styles.confirmText}>{BACKUP_IMPORT_CONFIRM}</Text>
              <View style={styles.row}>
                <Text style={styles.cancel} onPress={() => setConfirmImport(null)} accessibilityRole="button">
                  그만두기
                </Text>
                <Pressable disabled={busy} onPress={onRestore} style={styles.go}>
                  <Text style={styles.btnText}>{BACKUP_IMPORT_GO}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {note && <Text style={styles.note}>{note}</Text>}
      </ScrollView>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 10, paddingBottom: 32 },
  card: { backgroundColor: colors.cardSub, borderRadius: 22, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  desc: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textSub },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 4 },
  time: { fontFamily: fonts.numberBold, fontSize: 32, color: colors.yellow, minWidth: 110, textAlign: 'center' },
  dimmed: { opacity: 0.45 },
  btn: { height: 46, borderRadius: 23, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  btnSub: { backgroundColor: colors.track },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.line },
  confirm: { backgroundColor: colors.night, borderRadius: 16, padding: 12, gap: 10 },
  confirmText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.text },
  cancel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, padding: 6 },
  go: { backgroundColor: colors.pink, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 16 },
  note: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.relation, textAlign: 'center' },
});
