// 아침 "오늘 하루 고르기"와 마을 보상표가 보여 줄 마을 레벨 · 진행률 · 예정 보상. 읽기만 한다 (레벨 계산은 domain/village.ts).

import { useEffect, useMemo } from 'react';

import type { DayType } from '../domain/morning';
import { playHeungForLevel, progressRatio, salaryForLevel } from '../domain/rewards';
import { levelFromXp } from '../domain/village';
import { useFarm } from './farm';

export type MorningVillage = {
  level: number;
  /** 다음 레벨까지 0~1 */
  progress: number;
  /** 이 레벨에서 일 · 놀기를 고르면 받을 예정인 보상 (지급은 아직 하지 않는다) */
  rewards: Record<DayType, number>;
};

/** 경험치가 아직 안 읽혔으면 불러온다. 아침 흐름은 마을 탭보다 먼저 열릴 수 있다. */
export function useMorningVillage(): MorningVillage {
  const totalXp = useFarm((s) => s.totalXp);
  const load = useFarm((s) => s.load);
  useEffect(() => {
    load().catch((e) => console.warn('[morning] farm load failed', e));
  }, [load]);

  return useMemo(() => {
    const p = levelFromXp(totalXp);
    return {
      level: p.level,
      progress: progressRatio(p.into, p.needed),
      rewards: { work: salaryForLevel(p.level), play: playHeungForLevel(p.level) },
    };
  }, [totalXp]);
}
