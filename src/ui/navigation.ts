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

/** 아침 첫 화면 "솔이 깨우기" 다음에 갈 곳. */
export const AFTER_WAKE_HREF = '/morning/day' as const;

/** "오늘 하루 고르기" 다음에 갈 곳: 복장 고르기. */
export const AFTER_DAY_HREF = '/morning/outfit' as const;

/** "복장 고르기" 다음에 갈 곳. 아침 흐름의 다음 화면(마을)이 생기면 여기만 바꾼다. */
export const AFTER_OUTFIT_HREF = '/(tabs)' as const;

/** 하단 바를 숨기는 전체 화면 */
const FULLSCREEN_PATHS: readonly string[] = ['/wake', '/morning/day', '/morning/outfit'];

export function hidesBottomBar(path: string): boolean {
  return FULLSCREEN_PATHS.includes(path);
}
