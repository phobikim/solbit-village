// 웹 내보내기 후처리: dist/assets/node_modules → dist/assets/vendor
// Netlify는 배포할 때 'node_modules' 폴더를 빼 버려서 expo-sqlite의 wasm이 사라진다 (DB가 안 열림).
// 폴더 이름을 바꾸고 JS 안의 경로도 같이 바꾼다.
const fs = require('fs');
const path = require('path');

const dist = path.resolve(process.argv[2] || 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (!fs.existsSync(from)) {
  console.log('[fix-web-export] assets/node_modules 없음 — 할 일 없음');
  process.exit(0);
}
fs.rmSync(to, { recursive: true, force: true });
fs.renameSync(from, to);

let changed = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|html|json)$/.test(e.name)) {
      const s = fs.readFileSync(p, 'utf8');
      if (s.includes('assets/node_modules/')) {
        fs.writeFileSync(p, s.split('assets/node_modules/').join('assets/vendor/'));
        changed++;
      }
    }
  }
};
walk(dist);
console.log(`[fix-web-export] vendor로 옮김, 경로 고친 파일 ${changed}개`);
