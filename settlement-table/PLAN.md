# 정산표 7일 구현 계획

출시·검수 기간을 제외하고 아래 순서로 MVP를 구현합니다.

| 일차 | 목표                        | 완료 확인                       |
| ---- | --------------------------- | ------------------------------- |
| 1    | 새 앱 셸, 타입·입력 검증    | lint, validation tests          |
| 2    | 원화 정산 계산              | calculation tests               |
| 3    | React Hook Form 입력 흐름   | browser flow                    |
| 4    | 결과·송금 목록·공유         | share tests                     |
| 5    | 로컬 저장·내역·수정·삭제    | storage tests                   |
| 6    | 앱인토스 브리지·보상형 광고 | adapter tests, test environment |
| 7    | 회귀 검증·문서 정리         | test, lint, build, `ait build`  |

## 승인된 의존성 기준

- React 18.3.1, React DOM 18.3.1
- `@apps-in-toss/web-framework` 3.0.5, `@apps-in-toss/devtools` 3.0.5
- `@toss/tds-mobile` 2.5.1, `@toss/tds-mobile-ait` 2.5.1
- `react-hook-form` 7.87.0
- Vite 8.2.2, TypeScript 6.0.3, Vitest 4.1.9
- ESLint 및 React 타입 패키지는 `package.json`의 고정 버전을 사용

## 범위 고정

- 참여자 2~10명, 원화, 지출별 균등 분할만 지원합니다.
- 저장 2개까지 무료, 세 번째부터 보상형 광고 완료 후 저장합니다.
- 저장 한도는 10개이며, 기존 내역 수정은 광고와 저장 개수 증가가 없습니다.
- 서버 저장·실시간 공동 입력·송금 실행·OCR·배너 광고·전면 광고는 포함하지 않습니다.

## UI 디자인 기준

- 화면 디자인 작업은 [`정산표 UIUX 디자인`](<../docs/정산표 UIUX.dc.html>)을 기준으로 진행합니다.
- 독립 화면은 홈·저장 내역, 모임·참여자 설정, 지출 관리, 정산 결과의 4개로 구성합니다.
- 빈 상태, 지출 추가·수정, 삭제 확인, 저장·광고 안내는 별도 화면이 아니라 각 화면의 상태·바텀시트·모달로 처리합니다.
- 디자인 시안은 시각적 계층과 인터랙션 기준으로 사용하며, 계산·검증·저장 정책은 승인된 제품 설계와 테스트를 우선합니다.

## 소스 구조

- `src/features/settlement/`: 정산 타입·계산·검증·저장 정책 같은 순수 제품 규칙
- `src/components/`: 여러 화면에서 재사용하는 UI
- `src/screens/`: 사용자 화면과 화면 단위 조합
- `src/hooks/`: React 상태·폼·화면 흐름
- `src/lib/`: 앱인토스 SDK·저장소·공유 어댑터
- `src/test/`: 기능별 테스트·공통 fake·비식별 fixture

## 진행 기록

- [x] Day 1: 새 앱 셸, 콘솔 `appName` 일치 확인, 의존성 설치
- [x] Day 1: 정산 타입·입력 검증과 7개 테스트
- [x] Day 2: 결정적 정산 계산과 5개 테스트
- [x] 구조: `features/settlement`, `components`, `screens`, `hooks`, `lib`, `test` 역할 확정

2026-09-01 검증 결과:

```text
npm run lint   통과
npm run test   통과 (12 tests)
npm run build  통과 (tsc, Vite, ait build)
```

현재 번들은 기능 초기 단계라 Vite가 500 kB 초과 청크 경고를 표시하지만 빌드는 성공합니다. 다음 단계에서 화면 기능을 추가한 뒤 번들 크기를 다시 확인합니다.
