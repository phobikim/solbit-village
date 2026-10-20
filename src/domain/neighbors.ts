// 이웃 규칙 (SPEC 7장). 가까움 계산식은 [미정] — 단계 5에서 사용자와 정한다.

/** 기록 시트 "누구와"에 바로 보일 이웃 수 */
export const QUICK_NEIGHBOR_COUNT = 6;

export type NeighborContactStat = {
  id: string;
  name: string;
  createdAt: number;
  /** 전체 연락 횟수 */
  contactCount: number;
  /** 마지막 연락 날짜 (없으면 null) */
  lastContact: string | null;
};

/**
 * 기록 시트에 바로 보일 "자주 연락하는 이웃".
 * 연락 많은 순 → 최근 연락 순 → 먼저 등록한 순.
 */
export function frequentNeighbors<T extends NeighborContactStat>(all: readonly T[], n = QUICK_NEIGHBOR_COUNT): T[] {
  return [...all]
    .sort(
      (a, b) =>
        b.contactCount - a.contactCount ||
        (b.lastContact ?? '').localeCompare(a.lastContact ?? '') ||
        a.createdAt - b.createdAt,
    )
    .slice(0, n);
}
