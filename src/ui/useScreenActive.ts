// 화면이 포커스를 갖고 있고 앱이 앞에 있을 때만 true. 영상 · 애니메이션을 멈추고 재개하는 데 쓴다.

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useScreenActive(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);
  return focused && appActive;
}
