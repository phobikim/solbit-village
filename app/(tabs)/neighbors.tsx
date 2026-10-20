// 7c 이웃 — 단계 2 이후 채운다 (가까운 순 목록, 단짝, 안부 묻기 좋은 이웃).

import { mockBroadcasts } from '../../src/mocks/village';
import { Placeholder } from '../../src/ui/components/Placeholder';
import { Screen } from '../../src/ui/components/Screen';

export default function NeighborsScreen() {
  return (
    <Screen title="이웃" broadcast={mockBroadcasts.neighbors}>
      <Placeholder text="가까운 이웃 목록이 여기에 들어옵니다." />
    </Screen>
  );
}
