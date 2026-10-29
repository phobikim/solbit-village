// 아침 첫 화면 "솔이 깨우기" — 영상이 반복 재생되고 이장이 한마디, 버튼 하나. 기록·수치 UI 없음.
// 노출 조건은 src/domain/morning.ts · src/ui/features.ts (morningFlow 플래그).

import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { wakeBroadcast } from '../src/copy/broadcasts.ko';
import { WAKE_BUTTON } from '../src/copy/settings.ko';
import { wakePhase } from '../src/domain/morning';
import { BroadcastLine } from '../src/ui/components/BroadcastLine';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { AFTER_WAKE_HREF } from '../src/ui/navigation';
import { colors } from '../src/ui/theme';
import { useScreenActive } from '../src/ui/useScreenActive';

const poster = require('../assets/morning/wake-poster.jpg');
const loop = require('../assets/morning/wake-loop.mp4');

const pad = (n: number) => String(n).padStart(2, '0');

export default function WakeScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const [now] = useState(() => new Date());

  // 화면 포커스 · 앱 활성 상태가 모두 참일 때만 재생
  const screenActive = useScreenActive();

  // 모션 줄이기: 영상 원본을 불러오지도 않는다
  const player = useVideoPlayer(reduceMotion ? null : loop, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const shouldPlay = !reduceMotion && screenActive;
  useEffect(() => {
    if (reduceMotion) return;
    if (shouldPlay) player.play();
    else player.pause();
  }, [player, shouldPlay, reduceMotion]);

  return (
    <View style={styles.root}>
      {/* 정지 이미지는 영상 아래에 항상 깔려 있어 첫 프레임이 뜨기 전에도 비지 않는다 */}
      <Image source={poster} style={StyleSheet.absoluteFill} resizeMode="cover" accessible={false} />
      {!reduceMotion && (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          pointerEvents="none"
          accessible={false}
        />
      )}
      <View style={[styles.top, { top: insets.top + 12 }]}>
        <BroadcastLine message={wakeBroadcast[wakePhase(now)]} time={`${pad(now.getHours())}:${pad(now.getMinutes())}`} />
      </View>
      <View style={[styles.bottom, { bottom: 40 + insets.bottom }]}>
        <PrimaryButton label={WAKE_BUTTON} onPress={() => router.replace(AFTER_WAKE_HREF)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night, overflow: 'hidden' },
  top: { position: 'absolute', left: 0, right: 0 },
  bottom: { position: 'absolute', left: 24, right: 24 },
});
