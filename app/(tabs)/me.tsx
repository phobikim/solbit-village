// 7d 나 — 단계 2 이후 채운다 (솔이 프로필, 최근 4주 추세, 메뉴).

import { mockBroadcasts } from '../../src/mocks/village';
import { Placeholder } from '../../src/ui/components/Placeholder';
import { Screen } from '../../src/ui/components/Screen';

export default function MeScreen() {
  return (
    <Screen title="나" broadcast={mockBroadcasts.me}>
      <Placeholder text="솔이 프로필과 메뉴가 여기에 들어옵니다." />
    </Screen>
  );
}
