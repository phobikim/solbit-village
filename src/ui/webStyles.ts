// 웹 전용 전역 스타일 (design/solbit-v5.dc.html의 스크롤바 디자인).
// 네이티브(iOS)는 스크롤바 모양을 바꿀 수 없어 ScrollView의 indicatorStyle만 맞춘다.

import { Platform } from 'react-native';

import { colors } from './theme';

const SCROLLBAR_THUMB = '#4A5396';

const css = `
* { scrollbar-width: thin; scrollbar-color: ${SCROLLBAR_THUMB} transparent; }
::-webkit-scrollbar { width: 10px; height: 10px; background: transparent; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: ${SCROLLBAR_THUMB}; border-radius: 99px; border: 3px solid transparent; background-clip: padding-box; min-height: 40px; }
::-webkit-scrollbar-thumb:hover { background: ${colors.yellow}; background-clip: padding-box; }
::-webkit-scrollbar-thumb:active { background: ${colors.pink}; background-clip: padding-box; }
::-webkit-scrollbar-button, ::-webkit-scrollbar-corner { display: none; background: transparent; }
html, body { background: ${colors.nightOuter}; }
`;

let injected = false;

export function injectWebStyles(): void {
  if (Platform.OS !== 'web' || injected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.setAttribute('data-solbit', 'global');
  el.textContent = css;
  document.head.appendChild(el);
  injected = true;
}
