// 화면 경로 → 하단 바에서 켜질 탭

export type TabKey = 'village' | 'records' | 'neighbors' | 'rest' | 'me';

/** 탭 아래 하위 화면 */
const PAGES: readonly [TabKey, readonly string[]][] = [
  ['records', ['/records']],
  ['neighbors', ['/neighbors']],
  ['rest', ['/rest', '/place-map']],
  ['me', ['/me', '/storage', '/settings']],
];

/** 지금 화면이 어느 탭 아래인지. 시트 · 결과 카드처럼 어느 탭에도 속하지 않으면 null. */
export function tabOfPath(path: string): TabKey | null {
  if (path === '/' || path === '/index') return 'village';
  for (const [tab, pages] of PAGES) if (pages.some((p) => path === p || path.startsWith(`${p}/`))) return tab;
  return null;
}
