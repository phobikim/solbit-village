// 7b 기록 — 단계 2 이후 채운다 (월간 달력 + 날짜별 기록 카드).

import { mockBroadcasts } from '../../src/mocks/village';
import { Placeholder } from '../../src/ui/components/Placeholder';
import { Screen } from '../../src/ui/components/Screen';

export default function RecordsScreen() {
  return (
    <Screen title="기록" broadcast={mockBroadcasts.records}>
      <Placeholder text="월간 달력과 기록 카드가 여기에 들어옵니다." />
    </Screen>
  );
}
