// 지금 실제로 보이는 높이. 모바일 브라우저는 주소창 · 하단 툴바 때문에 100%/100vh가 보이는 영역보다 크다.
// 웹에서는 window.innerHeight(보이는 영역)를 쓰고, 주소창이 접히고 펴질 때(resize · visualViewport)도 따라간다.
// 네이티브는 useWindowDimensions 그대로.

import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

const readWeb = () => (typeof window === 'undefined' ? 0 : Math.round(window.innerHeight));

export function useVisibleHeight(): number {
  const { height } = useWindowDimensions();
  const [web, setWeb] = useState(readWeb);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const on = () => setWeb(readWeb());
    on();
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    window.visualViewport?.addEventListener('resize', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
      window.visualViewport?.removeEventListener('resize', on);
    };
  }, []);

  return Platform.OS === 'web' && web > 0 ? web : height;
}
