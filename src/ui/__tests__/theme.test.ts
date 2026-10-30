import { BG_ITEMS, BG_BASE } from '../../domain/villageBg';
import { celestialVisible, cloudSpecs, decoPiece, fireflySpecs, landSvg, plotCellSvg, rowSvg, skySvg, starPiece, treePieces, visibleStars, weatherSvg } from '../scene/art';
import { darken, lighten, mix, resolveTheme, themeIsLight, THEME_IDS, type VillageTheme } from '../scene/theme';

const HEX = /^#[0-9A-F]{6}$/;

/** 테마의 모든 색 값을 모은다 */
function colorsOf(t: VillageTheme): string[] {
  return [
    ...t.sky,
    ...(t.clouds ?? []),
    ...t.ridge,
    t.mid, t.yard, t.fore, t.path, t.water, t.wave, ...t.leaf, t.leafHi, t.tuft,
    t.soil.soil, t.soil.line, t.soil.pebble,
    ...(t.deco?.colors ?? []),
    t.struct.hut, t.struct.wood, t.struct.water, t.struct.hi,
  ];
}

describe('마을 배경 테마 7종', () => {
  it('배경 목록 7종이 모두 테마로 정의돼 있다 (낮 · 밤 어느 시각이든)', () => {
    expect(THEME_IDS).toEqual(BG_ITEMS.map((b) => b.id));
    for (const b of BG_ITEMS) {
      for (const tod of ['day', 'night'] as const) {
        const t = resolveTheme(b.id, tod);
        expect(t).toBeDefined();
        for (const c of colorsOf(t)) expect(c.toUpperCase()).toMatch(HEX);
      }
    }
  });

  it('모르는 id는 기본 테마', () => {
    expect(resolveTheme('volcano', 'day')).toBe(resolveTheme(BG_BASE, 'day'));
  });

  it('기본 테마만 시각에 따라 바뀌고, 구매 테마 6종은 낮이든 밤이든 같다 (고정 팔레트)', () => {
    expect(resolveTheme(BG_BASE, 'day')).not.toBe(resolveTheme(BG_BASE, 'night'));
    expect(resolveTheme(BG_BASE, 'day').sky).toEqual(['#4FB4F5', '#C4ECFF']);
    expect(resolveTheme(BG_BASE, 'night').sky).toEqual(['#141A44', '#2E2C74']);
    for (const b of BG_ITEMS.filter((x) => x.id !== BG_BASE)) {
      expect(resolveTheme(b.id, 'day')).toBe(resolveTheme(b.id, 'night'));
    }
  });

  it('기본 테마는 지금의 장면 색 그대로다 (회귀 없음)', () => {
    const day = resolveTheme(BG_BASE, 'day');
    expect([day.mid, day.yard, day.fore, day.path, day.ridge[0], day.ridge[1]]).toEqual(['#8ED062', '#A6DC6E', '#7FBE52', '#E8C98A', '#8EC6EE', '#6FB86A']);
    expect(day.soil.soil).toBe('#B07A4E');
    expect(day.clouds).toEqual(['#FFFFFF', '#EEF8FF']);
    const night = resolveTheme(BG_BASE, 'night');
    expect([night.mid, night.yard, night.fore, night.path, night.ridge[0], night.ridge[1]]).toEqual(['#212C5C', '#3E3966', '#2E2A55', '#4A4478', '#262B63', '#2C3470']);
    expect(night.stars).toBe(true);
    expect(night.particles).toBe('firefly');
    expect(day.particles).toBe('butterfly');
  });

  it('구매 6종은 시안 기준색(하늘 / 풀 / 흙 / 물 / 물결 / 나무)을 그대로 쓴다', () => {
    const want: Record<string, [string, string, string, string, string, string]> = {
      spring: ['#FFD6E8', '#7FD24A', '#B07A4E', '#5FD8FF', '#FFFFFF', '#FF8CC6'],
      autumn: ['#FFC98A', '#D9A84A', '#7A4A2E', '#2D5AA6', '#5FD8FF', '#FF6B3A'],
      winter: ['#BFE3FF', '#F4F6FB', '#9AA3C8', '#5A8FD6', '#FFFFFF', '#2F6A4A'],
      sunset: ['#FF9A7A', '#5FB04A', '#7A5470', '#7A5AA6', '#FFC98A', '#3E8A3A'],
      night: ['#10142E', '#2F6B4A', '#3A3466', '#1E2558', '#5FD8FF', '#24543A'],
      summer: ['#4FB4F5', '#5FBF3A', '#B07A4E', '#2D8AE6', '#BFEFFF', '#3E8A3A'],
    };
    for (const [id, [sky, grass, soil, water, wave, tree]] of Object.entries(want)) {
      const t = resolveTheme(id, 'day');
      expect([t.sky[0], t.yard, t.soil.soil, t.water, t.wave, t.leaf[0]]).toEqual([sky, grass, soil, water, wave, tree]);
    }
  });

  it('장식: 봄 꽃잎 · 가을 낙엽 · 겨울 눈 · 노을 낮은 해 · 별밤 별과 초승달 · 여름 해', () => {
    expect(resolveTheme('spring', 'day').deco?.kind).toBe('petal');
    expect(resolveTheme('autumn', 'day').deco?.kind).toBe('leaf');
    expect(resolveTheme('winter', 'day').deco?.kind).toBe('snow');
    expect(resolveTheme('winter', 'day').treeSnow).toBe(true);
    expect(resolveTheme('sunset', 'day').celestial).toBe('lowSun');
    expect(resolveTheme('night', 'day')).toMatchObject({ celestial: 'moon', stars: true });
    expect(resolveTheme('summer', 'day').celestial).toBe('sun');
  });

  it('시안이 정하지 않은 입자(반딧불이 · 나비)는 구매 테마에서 끈다', () => {
    for (const b of BG_ITEMS.filter((x) => x.id !== BG_BASE)) expect(resolveTheme(b.id, 'day').particles).toBe('none');
  });

  it('색 계산: 섞기 · 어둡게 · 밝게', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mix('#FF0000', '#FF0000', 0.3)).toBe('#FF0000');
    expect(darken('#FFFFFF', 0)).toBe('#FFFFFF');
    expect(lighten('#000000', 1)).toBe('#FFFFFF');
  });

  it('하늘이 밝은 테마만 상태바 글자를 어둡게 한다', () => {
    expect(themeIsLight(resolveTheme(BG_BASE, 'day'))).toBe(true);
    expect(themeIsLight(resolveTheme(BG_BASE, 'night'))).toBe(false);
    expect(themeIsLight(resolveTheme('night', 'day'))).toBe(false);
    expect(themeIsLight(resolveTheme('winter', 'day'))).toBe(true);
  });
});

describe('테마가 그림에 반영된다', () => {
  it('테마마다 하늘 · 땅 그림이 다르고 모두 유효한 SVG다', () => {
    const skies = new Set<string>();
    const lands = new Set<string>();
    for (const b of BG_ITEMS) {
      const t = resolveTheme(b.id, 'day');
      const sky = skySvg(t, 'sun');
      const land = landSvg(t);
      skies.add(sky);
      lands.add(land);
      expect(sky.startsWith('<svg')).toBe(true);
      expect(land).toContain(t.yard);
      expect(sky).toContain(t.sky[0]);
    }
    expect(skies.size).toBe(BG_ITEMS.length);
    expect(lands.size).toBe(BG_ITEMS.length);
  });

  it('밭 흙 · 냇가 물 · 나무 잎이 테마 색이다', () => {
    const t = resolveTheme('autumn', 'day');
    expect(plotCellSvg(null, t)).toContain(t.soil.soil);
    expect(rowSvg(t, { board: [], boardToday: false, lanternOn: false, bloom: 0 })).toContain(t.water);
    expect(treePieces(t)[0].piece.xml).toContain(t.leaf[0]);
  });

  it('겨울 나무에는 눈이 얹힌다', () => {
    expect(treePieces(resolveTheme('winter', 'day'))[0].piece.xml).toContain('#FFFFFF');
    expect(treePieces(resolveTheme('spring', 'day'))[0].piece.xml).not.toContain('Q0 -40');
  });

  it('장식 점은 있는 테마에만 그린다', () => {
    expect(decoPiece(resolveTheme('spring', 'day'))).not.toBeNull();
    expect(decoPiece(resolveTheme(BG_BASE, 'day'))).toBeNull();
  });

  it('구름은 테마가 정한 것만, 비 · 폭풍이면 어두워진다', () => {
    expect(cloudSpecs(resolveTheme('night', 'day'), 'sun')).toHaveLength(0);
    expect(cloudSpecs(resolveTheme('winter', 'day'), 'sun')).toHaveLength(3);
    expect(cloudSpecs(resolveTheme('winter', 'day'), 'rain')[0].piece.xml).toContain(resolveTheme('winter', 'day').struct.darkCloud);
  });
});

describe('날씨 5단계 표현 (테마 위에 겹친다)', () => {
  const t = resolveTheme(BG_BASE, 'night');
  it('맑음은 아무것도 겹치지 않고, 나머지는 구름 · 비 · 번개가 단계별로 늘어난다', () => {
    expect(weatherSvg(t, 'sun')).toBeNull();
    const count = (s: string | null, re: RegExp) => (s?.match(re) ?? []).length;
    const clouds = (w: Parameters<typeof weatherSvg>[1]) => count(weatherSvg(t, w), /A15 15/g);
    expect(clouds('cloud')).toBe(2);
    expect(clouds('over')).toBe(3);
    expect(clouds('rain')).toBe(3);
    expect(clouds('storm')).toBe(3);
    expect(weatherSvg(t, 'cloud')).not.toContain('#5FD8FF');
    expect(weatherSvg(t, 'rain')).toContain('#5FD8FF');
    expect(weatherSvg(t, 'rain')).not.toContain('M184 96');
    expect(weatherSvg(t, 'storm')).toContain('M184 96');
  });
  it('폭풍이면 달 · 별이 숨고, 비 오는 날은 해만 숨는다', () => {
    expect(celestialVisible(resolveTheme(BG_BASE, 'night'), 'storm')).toBe(false);
    expect(celestialVisible(resolveTheme(BG_BASE, 'night'), 'rain')).toBe(true);
    expect(celestialVisible(resolveTheme(BG_BASE, 'day'), 'rain')).toBe(false);
    expect(celestialVisible(resolveTheme(BG_BASE, 'day'), 'sun')).toBe(true);
    expect(celestialVisible(resolveTheme('spring', 'day'), 'sun')).toBe(false);
  });
  it('날씨가 나쁠수록 별이 덜 보인다 (14 → 7 → 4 → 2 → 0)', () => {
    expect(['sun', 'cloud', 'over', 'rain', 'storm'].map((w) => visibleStars(w as 'sun'))).toEqual([14, 7, 4, 2, 0]);
    expect(starPiece(0, 0)).toBeNull();
    expect(starPiece(0, 14)).not.toBeNull();
  });
  it('입자는 반딧불이 6 · 나비 3', () => {
    expect(fireflySpecs()).toHaveLength(6);
  });
});
