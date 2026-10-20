// 개발용 샘플 이웃. 이웃 등록 화면(9f, 단계 5)이 생기기 전에 기록 시트의 "누구와"를 확인하는 용도.
// __DEV__에서만 버튼으로 노출한다.

import { insertNeighbor, newNeighborId, type Neighbor } from './neighbors';

const SAMPLES: Omit<Neighbor, 'id' | 'createdAt'>[] = [
  { name: '서연', face: 1, color: 4, relation: 'coworker', frequency: 'often' },
  { name: '하준', face: 5, color: 2, relation: 'friend', frequency: 'often' },
  { name: '할머니', face: 10, color: 1, relation: 'family', frequency: 'sometimes' },
  { name: '지은', face: 3, color: 0, relation: 'coworker', frequency: 'sometimes' },
  { name: '엄마', face: 2, color: 5, relation: 'family', frequency: 'often' },
  { name: '민수', face: 7, color: 3, relation: 'friend', frequency: 'rarely' },
  { name: '할아버지', face: 11, color: 1, relation: 'family', frequency: 'rarely' },
];

export async function seedSampleNeighbors(): Promise<void> {
  const now = Date.now();
  for (let i = 0; i < SAMPLES.length; i++) {
    await insertNeighbor({ ...SAMPLES[i], id: newNeighborId(now + i), createdAt: now + i });
  }
}
