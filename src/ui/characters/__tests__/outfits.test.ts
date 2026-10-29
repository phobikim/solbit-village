import { OUTFIT_NAME } from '../../../copy/outfits.ko';
import { OUTFIT_ITEMS, SPLIT_ITEMS } from '../../../domain/outfit';
import { dressedThumbBox, itemThumbBox, OUTFIT_ART } from '../outfits';
import { silhouetteSvg } from '../outfits/silhouette';
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

describe('칸 썸네일 배치', () => {
  it('60px 칸: 솔이 몸이 약 54px 높이로 들어온다', () => {
    // 캔버스 240 중 솔이 몸 196 → 0.9 × 60 = 54
    const b = dressedThumbBox('feet-boots', 60);
    expect(b.height / 240).toBeGreaterThan(0.2);
    const s = b.width / 200;
    expect(196 * s).toBeLessThanOrEqual(54.01);
  });

  it('아이템 영역이 칸 밖으로 나가지 않는다', () => {
    for (const it of OUTFIT_ITEMS) {
      const b = dressedThumbBox(it.id, 60);
      const s = b.width / 200;
      // 캔버스 왼쪽 위 → 칸 안 위치. 솔이 몸(14~186, 14~210)이 칸 안에 있어야 한다
      expect(b.left + 14 * s).toBeGreaterThanOrEqual(-0.5);
      expect(b.left + 186 * s).toBeLessThanOrEqual(60.5);
      expect(b.top + (14 + 20) * s).toBeGreaterThanOrEqual(-0.5);
      expect(b.top + (210 + 20) * s).toBeLessThanOrEqual(60.5);
    }
  });

  it('긴 옷(날개)은 가로가 칸을 꽉 채우고 풍선은 세로가 꽉 찬다', () => {
    expect(itemThumbBox('back-wings', 48).width).toBeGreaterThan(48 * 0.9);
    const s = itemThumbBox('hand-balloon', 48).width / 200;
    expect(160 * s).toBeLessThanOrEqual(48);
  });
});

describe('실루엣', () => {
  it('색은 한 가지로 칠하고 none은 그대로 둔다', () => {
    const out = silhouetteSvg('<g fill="#FF0000" stroke="#10142E"><path fill="none" d="M0 0"/><circle fill="white" r="1"/></g>', '#2E3672');
    expect(out).toBe('<g fill="#2E3672" stroke="#2E3672"><path fill="none" d="M0 0"/><circle fill="#2E3672" r="1"/></g>');
  });

  it('mask 안의 색은 건드리지 않는다', () => {
    const out = silhouetteSvg('<mask id="m"><rect fill="white"/><rect fill="black"/></mask><path fill="#FF0000"/>', '#2E3672');
    expect(out).toBe('<mask id="m"><rect fill="white"/><rect fill="black"/></mask><path fill="#2E3672"/>');
  });

  it('실제 옷 그림도 칠해진다', () => {
    const xml = OUTFIT_ART['head-straw'].single!;
    const out = silhouetteSvg(xml, '#2E3672');
    expect(out).toContain('#2E3672');
    expect(out).not.toMatch(/fill="#(?!2E3672)[0-9A-Fa-f]{3,8}"/);
  });
});
