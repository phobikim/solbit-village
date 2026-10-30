import { OUTFIT_NAME } from '../../../copy/outfits.ko';
import { OUTFIT_ITEMS, SPLIT_ITEMS } from '../../../domain/outfit';
import { dressedThumbBox, itemThumbBox, OUTFIT_ART } from '../outfits';
import { SOLI_POSES } from '../soliPoses';

describe('옷 그림 모음', () => {
  it('카탈로그의 모든 옷에 그림이 있다', () => {
    for (const it of OUTFIT_ITEMS) expect(OUTFIT_ART[it.id]).toBeDefined();
    expect(Object.keys(OUTFIT_ART)).toHaveLength(25);
  });

  it('앞뒤가 갈리는 옷은 back · front 두 장, 나머지는 한 장 (총 28장)', () => {
    let files = 0;
    for (const it of OUTFIT_ITEMS) {
      const art = OUTFIT_ART[it.id];
      if (SPLIT_ITEMS.has(it.id)) {
        expect(art.back && art.front).toBeTruthy();
        expect(art.single).toBeUndefined();
        files += 2;
      } else {
        expect(art.single).toBeTruthy();
        expect(art.back ?? art.front).toBeUndefined();
        files += 1;
      }
    }
    expect(files).toBe(28);
  });

  it('모두 기본 포즈와 같은 viewBox (0 -20 200 240)', () => {
    expect(SOLI_POSES.base).toContain('viewBox="0 -20 200 240"');
    for (const art of Object.values(OUTFIT_ART)) {
      for (const xml of [art.single, art.back, art.front]) if (xml) expect(xml).toContain('viewBox="0 -20 200 240"');
    }
  });

  it('react-native-svg가 못 그리는 요소가 없다 (필터 · 그라데이션 · 이미지 · 글자 …)', () => {
    for (const art of Object.values(OUTFIT_ART)) {
      for (const xml of [art.single, art.back, art.front]) {
        if (xml) expect(xml).not.toMatch(/<(filter|linearGradient|radialGradient|pattern|image|text|use|style|foreignObject|metadata)\b/);
      }
    }
  });

  it('그림 안의 id는 파일마다 겹치지 않는다 (웹에서 겹쳐 그려도 clipPath · mask가 섞이지 않게)', () => {
    const seen = new Map<string, string>();
    for (const [itemId, art] of Object.entries(OUTFIT_ART)) {
      for (const [part, xml] of Object.entries(art)) {
        for (const m of (xml as string).matchAll(/ id="([^"]+)"/g)) {
          const owner = `${itemId}:${part}`;
          expect(seen.has(m[1]) ? seen.get(m[1]) : owner).toBe(owner);
          seen.set(m[1], owner);
        }
      }
    }
  });

  it('url(#id) 참조는 모두 같은 파일 안의 id를 가리킨다', () => {
    for (const art of Object.values(OUTFIT_ART)) {
      for (const xml of [art.single, art.back, art.front]) {
        if (!xml) continue;
        const ids = new Set([...xml.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
        for (const m of xml.matchAll(/url\(#([^)]+)\)/g)) expect(ids.has(m[1])).toBe(true);
      }
    }
  });

  it('한국어 이름이 모두 있고 한글 · 영문 · 공백뿐이다 (한자 금지)', () => {
    for (const it of OUTFIT_ITEMS) {
      expect(OUTFIT_NAME[it.id]).toBeTruthy();
      expect(OUTFIT_NAME[it.id]).toMatch(/^[가-힣A-Za-z ]+$/);
    }
  });
});

describe('칸 썸네일 배치 (시안 옷장 TURN 28 thumb() / dressed())', () => {
  it('80px 칸: 솔이 몸 + 아이템이 한 정사각형에 들어온다 (몸 · 등)', () => {
    for (const id of OUTFIT_ITEMS.filter((i) => i.slot === 'body' || i.slot === 'back').map((i) => i.id)) {
      const b = dressedThumbBox(id, 80);
      const s = b.width / 200;
      // 캔버스(200×240) 왼쪽 위 → 칸 안 위치. 솔이 몸(14~186, 14~210)이 칸 안에 있어야 한다
      expect(b.left + 14 * s).toBeGreaterThanOrEqual(-0.5);
      expect(b.left + 186 * s).toBeLessThanOrEqual(80.5);
      expect(b.top + (14 + 20) * s).toBeGreaterThanOrEqual(-0.5);
      expect(b.top + (210 + 20) * s).toBeLessThanOrEqual(80.5);
    }
  });

  it('시안과 같은 값: 후드티 dressed 80, 비니 thumb 80', () => {
    // dressed: bb [8,108,184,102] → x0 8, y0 14, x1 192, y1 210 → s = min(76.8/184, 76.8/196)
    const d = dressedThumbBox('body-hoodie', 80);
    expect(d.width).toBeCloseTo(200 * (76.8 / 196), 0);
    // thumb: bb [26,14,148,102], s = min(80*.9/148, 80*.9/102, 1.3) = 0.4865
    const t = itemThumbBox('head-beanie', 80);
    expect(t.width).toBeCloseTo(200 * ((80 * 0.9) / 148), 0);
  });

  it('긴 옷(날개)은 가로가 칸을 꽉 채우고 풍선은 세로가 꽉 찬다', () => {
    expect(itemThumbBox('back-wings', 80).width).toBeGreaterThan(80 * 0.9);
    const s = itemThumbBox('hand-balloon', 80).width / 200;
    expect(160 * s).toBeLessThanOrEqual(80 * 0.91);
  });

  it('모든 옷의 크롭 영역 값은 요청서와 같다 (bb)', () => {
    // 몇 개를 골라 크기 비율로 확인: 우산 [146,118,50,100] → 세로 기준 s = 72/100
    expect(itemThumbBox('hand-umbrella', 80).width / 200).toBeCloseTo(0.72, 2);
    // 별 [128,135,36,36] → 가로 기준 s = min(72/36, 72/36, 1.3) = 1.3
    expect(itemThumbBox('face-star', 80).width / 200).toBeCloseTo(1.3, 2);
  });
});

