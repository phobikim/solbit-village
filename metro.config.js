// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite 웹: wa-sqlite의 .wasm 파일을 에셋으로 번들
config.resolver.assetExts.push('wasm');

// expo-sqlite 웹의 동기 API는 SharedArrayBuffer가 필요 → 개발 서버 응답에 COOP/COEP 헤더 추가.
// 주의: Expo CLI는 이 미들웨어를 Metro 번들 응답에만 감싸므로 HTML 문서에는 적용되지 않을 수 있다.
// 그래서 앱 코드는 비동기 API만 쓴다 (src/data/db.ts). 배포 시 헤더는 app.json expo-router 플러그인 설정.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
