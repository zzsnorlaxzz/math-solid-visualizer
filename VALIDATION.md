# 검증 기록

2026-11-10 클라우드 환경에서 검증했습니다.

- Node.js 24.22.1, npm 11.9.0, Chromium headless/SwiftShader
- `npm test`: Vitest 10개 통과. 여러 반지름·높이에 대해 원뿔 체적비와 물 체적/수위, 구면 띠 면적 합, 단면 관계(각 반지름에서 101개 높이), 반구/구 부피, 반지름 두 배와 부피 여덟 배, 잘못된 입력 거부를 검증했습니다.
- `npm run build`: TypeScript 및 Vite 빌드 성공. Three.js 포함 초기 번들이 커서 Vite 크기 경고가 있습니다(오류 아님).
- Playwright + 시스템 Chromium: 개발 서버 및 production preview에서 세 단원 렌더링/전환, 기본 공식 숨김, 공식 공개, 물 채우기, 진행도, 집중 모드 복귀, 판서 마우스 입력/실행 취소/다시 실행/영역 확대/새로고침 복구 확인. 수정 후 브라우저 pageerror 없음.
- CDP 입력: touch 이벤트는 기본 모드에서 획을 생성하지 않고 pen 이벤트는 획을 생성함. PNG 다운로드 성공, 재생/일시정지, 마지막 단계 렌더링, 삭제 취소 확인.
- 1440×1000, 1280×800, 600×900 레이아웃 확인. 좁은 화면에서 가로 overflow 없음.
- 초기 단원 전환 중 발생한 DOM 라벨 제거 오류는 WebGL Sprite 라벨로 수정했습니다.

실제 Galaxy Tab/S Pen, 하드웨어 압력·팜 리젝션, 핀치 제스처, 미러링 성능은 미검증이며 README의 수동 검증이 필요합니다.

Git 원격 push는 성공했습니다. GitHub API 및 Pages 호스트는 현재 클라우드 네트워크에서 CONNECT 403으로 차단되어 Actions 실행 결과, 저장소 공개 범위, Pages Source 설정 및 배포된 앱 접속은 확인하지 못했습니다. 환경 설정 초안에 필요한 도메인 두 개(api.github.com, zzsnorlaxzz.github.io)를 추가했습니다. 네트워크 설정 적용 후 API 접근을 재확인해야 하며 Git 인증 성공은 API 쓰기 권한을 보장하지 않습니다.
