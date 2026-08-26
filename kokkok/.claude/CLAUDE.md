# CLAUDE.md — kokkok

이 프로젝트에서 작업하기 전에 반드시 이 문서를 읽으세요.
**앱인토스(Apps in Toss)는 2025~2026년에 나온 플랫폼이라 학습 데이터에 거의 없습니다.
일반 React 웹앱 상식으로 판단하지 말고, 이 문서와 타입 정의를 기준으로 삼으세요.**

---

## 1. 이 프로젝트가 뭔지

**토스 앱 안에서 실행되는 미니앱(WebView 방식)입니다.** 일반 웹사이트가 아닙니다.
사용자는 토스 앱 → 미니앱 목록에서 진입하고, 별도 설치가 없습니다.

**앱 이름:** 콕콕 (appName: `kokkok-app`)

**하는 일:** 사진을 고르고, 사진 위를 눌러 번호 뱃지(①②③)를 찍고, 뱃지마다 한 줄 설명을 붙여,
사진 + 뱃지 + 하단 설명 목록을 합성한 이미지 한 장을 기기에 저장한다.

> ⚠️ **'앨범 저장'은 아직 확정된 사실이 아닙니다.** 공식 문서의 `saveBase64Data`는 "사용자 기기에 저장(파일 저장)"으로만
> 설명돼 있고, 사진첩 전용 저장 API는 문서에 없습니다. D2에 실기기로 확인한 뒤 UX 문구를 확정하세요. (PLAN 2.6)

**대표 사용 상황:** 중고로 물건을 팔 때 흠집 위치를 표시해서 거래 앱에 올린다.

**개발 기간 목표: 10일. 1인 개발.** 범위를 늘리는 모든 제안은 기본적으로 거절 대상입니다.

---

## 2. 기술 스택 (확정 — 변경 금지)

```
Vite 8 + React 18 + TypeScript
@apps-in-toss/web-framework  ^3.0.5   # SDK
@apps-in-toss/devtools       ^3.0.5   # vite 플러그인
@toss/tds-mobile             ^2.5.1   # 토스 디자인 시스템 (권장 / 모달은 필수)
@toss/tds-mobile-ait         ^2.5.1   # TDS 색 변수 공급. 없으면 모든 배경이 투명해짐 (D-016)
상태: useState (필요시 zustand)
이미지 합성: canvas API (라이브러리 없이)
서버 없음 / DB 없음 / 로그인 없음
```

### 설치하지 말 것

`redux` `react-hook-form` `styled-components` `react-dnd` `react-router-dom` `html2canvas`
`axios` `framer-motion` — 화면 3개짜리 앱에 전부 오버스펙입니다.

새 의존성 추가는 **먼저 물어보고** 진행하세요.

### React 19로 올리지 말 것

`@toss/tds-mobile` 2.5.1의 peerDependencies가 react 16.8.3 / 17 / 18까지만 허용합니다.
`--force`나 `overrides`로 우회하지 마세요. React 18 고정 근거는 이 peer 범위 하나로 충분합니다.

**TDS는 검수 '필수'가 아니라 '권장'입니다** (공식 FAQ, 2026-08-24 확인).
다만 비게임 출시 체크리스트에 "사용자 안내나 확인이 필요한 경우 TDS 모달을 사용해요"가 있으므로
**다이얼로그·바텀시트는 TDS를 씁니다.**

### TDS는 패키지 2개가 한 쌍입니다

`@toss/tds-mobile`은 색을 `var(--adaptiveBackground)` 같은 CSS 변수로 **참조만 하고 정의하지 않습니다.**
정의는 `@toss/tds-colors`에 있고, 그걸 끌고 오는 게 `@toss/tds-mobile-ait`입니다.
이게 없으면 컴포넌트가 렌더는 되는데 **배경이 전부 투명**하게 나옵니다. 크롬·실기기 양쪽에서 똑같습니다.

앱 최상단은 이 Provider 하나로 끝냅니다. `TDSMobileProvider`나 `ThemeProvider`를 직접 쓰지 마세요 —
`userAgent`와 브랜드 색(`apps-in-toss.config.ts`의 `brand.primaryColor`)까지 이 안에서 처리합니다.

```tsx
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";

<TDSMobileAITProvider>
  <App />
</TDSMobileAITProvider>;
```

**: 설치만 해두고 쓰지 않는 의존성은 검증되지 않습니다.** TDS는 D0에 설치됐지만, 어느 파일에서도 import되지 않아서, 처음 쓰는 순간까지 결함이 드러날 수 없었습니다.

---

## 3. SDK 3.x — 버전이 중요합니다

이 프로젝트는 **SDK 3.x**입니다. 인터넷에 돌아다니는 2.x 예제와 문법이 다릅니다.

| 2.x (구버전, 쓰지 말 것)            | 3.x (현재)                           |
| ----------------------------------- | ------------------------------------ |
| `granite.config.ts`                 | **`apps-in-toss.config.ts`**         |
| `granite build` / `granite dev`     | **`ait build`**                      |
| `webViewProps: { type: 'partner' }` | **`webView: { ... }`** (`type` 없음) |
| `outdir`                            | **`webBundleDir`**                   |

**검색이나 기억으로 나온 예제가 위 왼쪽 문법이면 그건 구버전입니다. 적용하지 마세요.**

### 확실하지 않으면 타입 정의를 읽으세요

```bash
grep -rn "찾을것" node_modules/@apps-in-toss/web-framework --include="*.d.ts"
npx tsc -b        # ⚠️ `--noEmit`이 아닙니다
```

> **`npx tsc --noEmit`은 아무것도 검사하지 않습니다.** 루트 `tsconfig.json`이 `files: []`에
> 참조만 걸어둔 껍데기라 조용히 통과합니다. 실제로 검사하려면 `npx tsc -b`를 쓰세요
> (`npm run build`가 쓰는 것). 선언조차 없는 변수를 쓴 코드가 `--noEmit`을 통과한 사례가 있습니다.

문서나 커뮤니티 글보다 `node_modules`의 `.d.ts`가 정확합니다.
API 이름을 추측해서 쓰지 말고, 반드시 타입에서 확인한 이름을 쓰세요.

### 이 앱이 쓸 API (2026-08-24 실기기 검증 완료)

```ts
import { Device, File } from "@apps-in-toss/web-framework";

Device.getPhotos({ maxCount: 1, maxWidth: 2048, base64: true });
// → Promise<{ id: string; dataUri: string }[]>
File.saveBase64({ data, fileName, mimeType });
```

**`fetchAlbumItems` / `saveBase64Data`를 직접 쓰지 마세요.** 같은 기능이지만 안전장치가 없습니다.

| 쓰지 말 것        | 쓸 것              | 이유                                                                       |
| ----------------- | ------------------ | -------------------------------------------------------------------------- |
| `saveBase64Data`  | `File.saveBase64`  | 전자는 토스 앱 버전이 낮으면 `console.warn`만 남기고 **조용히 통과**한다   |
| `fetchAlbumItems` | `Device.getPhotos` | 전자는 권한 처리가 없다. 후자는 권한을 요청하고 거부 시 전용 에러를 던진다 |

### 앨범 API 함정 (실기기에서만 드러남 — 반나절 날린 것)

**1. `dataUri`는 이름과 달리 data URI가 아니다.**
`base64` 옵션이 없으면 `file:///data/user/0/viva.republica.toss/cache/photo_xxx` 경로가 옵니다.
WebView는 https origin에서 그 파일을 못 읽어 `<img>` 로드가 실패합니다. **`base64: true` 필수.**

**2. `base64: true`를 줘도 `data:` 접두사가 안 붙는다.**
`/9j/4AAQSkZJRg...` 형태의 순수 base64로 옵니다. 직접 `data:image/jpeg;base64,`를 붙여야 합니다.
`lib/bridge.ts`의 `toDataUri()`가 이 처리를 합니다.

**3. 취소하면 빈 배열이다.** 에러가 아닙니다 (실기기 확인). 단 브라우저 mock은 에러를 던집니다.

**브라우저 mock은 항상 정상적인 data URI를 주기 때문에 1·2번이 전혀 드러나지 않습니다.**
앨범·저장 관련 코드는 반드시 실기기에서 확인하세요.

### 뒤로가기를 구독하면 앱이 안 꺼집니다 (2026-08-26, D-022)

```ts
import { graniteEvent } from "@apps-in-toss/web-framework";

const unsubscribe = graniteEvent.addEventListener("backEvent", {
  onEvent: () => { /* 여기서 처리 */ },
  onError: (error) => console.error(error),
});
```

**구독하는 순간 토스 기본 뒤로가기(미니앱 종료)가 차단됩니다.** 공식 문서에
"기본 뒤로가기는 차단돼요"라고 적혀 있습니다. 구독을 해제하면 되살아납니다.

그래서 **뒤로가기를 가로채야 하는 화면에서만** 구독하세요. 앱 전역에서 한 번 걸어두면
홈 화면에서도 종료가 막혀 **"최초 화면에서 뒤로가기를 누르면 미니앱이 종료됨"
심사 항목에 걸립니다** (4번 참고). `lib/useBackEvent.ts`가 이 규칙을 담고 있고,
`Tagging`만 이 훅을 씁니다.

브라우저 mock에서는 `window`에 `__ait:backEvent`를 쏘면 그대로 재현됩니다.

```js
window.dispatchEvent(new Event("__ait:backEvent"));
```

**TDS의 `closeOnBackEvent`는 이 프로젝트에서 동작하지 않습니다.** 그 옵션은 프로바이더가
주입하는 backEvent 객체에 의존하는데 `@toss/tds-mobile-ait`에는 그 코드가 없습니다.
`AlertDialog`·`ConfirmDialog`에만 있는 옵션이고, `BottomSheet`에는 아예 없습니다.
켜도 아무 일이 일어나지 않으니 뒤로가기는 직접 배선하세요.

---

## 4. 절대 하면 안 되는 것 (심사 반려 사유)

| 금지                                         | 비고                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `eval` 등 외부에서 받은 코드 실행            | 체크리스트 '보안 및 안정성' 명시 항목                                       |
| `window.location.replace` 등 히스토리 조작   | 자사 사이트 유도 금지. 명시 항목                                            |
| SSR                                          | CSR/SSG만 허용. Vite SPA라 현재 구성은 통과                                 |
| `http://` · `ws://` 통신                     | HTTPS / `wss://`만 허용                                                     |
| 핀치 줌 허용                                 | `index.html`에 `user-scalable=no` 필수                                      |
| 진입 즉시 바텀시트                           | 알림 동의 바텀시트 포함                                                     |
| 뒤로가기 시 이탈 방지 바텀시트               | 다크패턴                                                                    |
| 전면 광고                                    | 배너만 허용                                                                 |
| 모호한 CTA 문구                              | 버튼만 보고 다음 행동을 알 수 있어야 함                                     |
| 나갈 선택지가 없는 화면                      | 다크패턴                                                                    |
| 웹 표준 저장소에 영속 데이터 의존            | 금지는 아님. QR 테스트↔출시 Origin이 달라 공유 안 됨. SDK `Storage`를 쓸 것 |
| 다크모드 구현                                | 앱인토스는 현재 다크모드 미지원. 라이트 기준으로만                          |
| 토스 제공 아이콘·이모지를 저장 이미지에 삽입 | 외부 배포 금지 자산                                                         |

> `iframe` 금지 조항은 **공식 문서에서 확인되지 않았습니다** (2026-08-24 MCP 대조).
> 어차피 쓸 일이 없으니 쓰지 않지만, 근거가 필요하면 채널톡에 문의하세요.
> IndexedDB는 iOS에서 **7일간 상호작용이 없으면 자동 삭제**됩니다. 로컬 캐시가 필요하면 Cache API를 쓰세요.

---

## 5. 설정 파일 (수정 시 주의)

### `apps-in-toss.config.ts`

```ts
permissions: [
  { name: 'photos', access: 'read' },   // 앨범에서 사진 고르기
  { name: 'photos', access: 'write' },  // 합성 이미지 저장
],
webView: {
  bounces: false,
  pullToRefreshEnabled: false,
  overScrollMode: 'never',
  allowsBackForwardNavigationGestures: false,
},
webBundleDir: 'dist',
```

**webView의 4개 false를 절대 되돌리지 마세요.** 사진 위에서 뱃지를 드래그하는 게 이 앱의 핵심인데,

- `pullToRefreshEnabled: true` → 위로 끌면 새로고침되어 **작업 내용이 전부 날아감**
- `bounces: true` → 드래그 시 화면 전체가 튕김
- `allowsBackForwardNavigationGestures: true` → 사진 왼쪽 끝 뱃지를 끌면 iOS가 뒤로가기로 인식

`appName`은 앱인토스 콘솔 등록값과 정확히 일치해야 합니다.

### `vite.config.ts`

`aitDevtools.vite()`가 `react()`보다 **앞**에 와야 합니다. 순서를 바꾸지 마세요.

---

## 6. 구현 규칙

### 좌표는 반드시 0~1 정규화

원본 사진(4000×3000)과 화면 표시 크기(375px)가 다릅니다.
화면 픽셀 좌표를 저장하면 합성 시 위치가 어긋납니다.

```ts
// ❌ 금지
{ x: 210, y: 340 }

// ✅ 필수
{ x: (clickX - imgOffsetX) / imgDisplayWidth,   // 0~1
  y: (clickY - imgOffsetY) / imgDisplayHeight }

// canvas에 그릴 때
ctx.arc(tag.x * canvas.width, tag.y * canvas.height, r, 0, Math.PI * 2)
```

### 말풍선 만들지 말 것

사진 위에는 **번호 뱃지(원 + 숫자)만** 그리고, 설명 텍스트는 **사진 아래 흰 영역에 목록으로** 그립니다.

canvas에는 자동 줄바꿈이 없어서 말풍선을 그리려면 `measureText`로 한글 줄바꿈을 직접 계산하고,
말풍선 크기·꼬리 위치·화면 이탈·뱃지 간 겹침까지 전부 처리해야 합니다. 이틀이 날아갑니다.

번호는 한 글자라 줄바꿈이 원천적으로 발생하지 않습니다. 그리고 번호는 하단 목록과 1:1로 대응하는
**인덱스 역할**을 하므로 이모지 등으로 대체할 수 없습니다.

### 상태 구조

```ts
type Tag = {
  id: string;
  x: number; // 0~1
  y: number; // 0~1
  label: string; // 한 줄 설명
};

const BADGE_COLOR = "#FF6B00"; // 화면과 합성 이미지가 같은 값을 씁니다
```

이 이상 복잡해지면 범위가 넘친 것입니다.

---

## 7. 화면 구조 (3개 고정)

```
[홈]  ──사진 고르기──▶  [태깅]  ──이미지로 저장하기──▶  [완료]
                          │
                     (뱃지 탭 → 설명 입력 바텀시트)
```

라우터를 설치하지 말고 `useState`로 화면을 전환하세요.

기준 해상도는 **375 × 812 하나**입니다. 반응형 브레이크포인트를 만들지 마세요.

### 파일 구조 (2026-08-25 정리, D-019)

```
src/
├── App.tsx              화면 전환 + 태그 상태(단일 소유자)
├── types.ts  main.tsx  App.css  index.css
├── screens/     Home.tsx  Tagging.tsx
├── components/  TagList.tsx  LabelSheet.tsx  DiscardDialog.tsx
└── lib/         usePinGestures.ts  useBackEvent.ts  compose.ts  bridge.ts
```

- **태그 상태는 `App.tsx`만 가집니다.** 화면은 props로 받고 콜백으로 올려보냅니다. 상태를 아래로 내리지 마세요 — 합성·저장이 `App`에 있습니다.
- **`lib/usePinGestures.ts`는 손대기 전에 파일 맨 위 주석을 읽으세요.** 8px 문턱, 포인터 캡처, 시트를 `pointerup`이 아니라 `click`에서 여는 이유가 전부 실기기 버그에서 나온 규칙입니다.
- **토스 SDK는 `lib/` 안에서만 부릅니다.** `screens/`·`components/`·`App.tsx`에서 `@apps-in-toss/web-framework`를 import하지 마세요. 지금 SDK를 쓰는 파일은 `lib/bridge.ts`(앨범·저장)와 `lib/useBackEvent.ts`(뒤로가기) 둘뿐입니다. 이 경계가 있어야 나머지를 브라우저에서 확인할 수 있습니다.
- 폴더를 더 쪼개지 마세요. 파일 12개에 3단계 이상은 과설계입니다.

---

## 8. 만들지 않는 것 (제안하지도 말 것)

- 로그인 / 계정 / 서버 / DB / 이미지 업로드
- 저장한 카드 다시 열기
- 사진 여러 장
- 색상 / 폰트 / 뱃지 모양 커스텀, 이모지 스티커 팔레트
- 태그 회전 / 크기 조절
- 온보딩 / 설정 / 마이페이지 / 탭바
- 다크모드
- 말풍선 UI

각 항목이 왜 빠졌는지는 `DECISIONS.md`에 있습니다. 되살리자는 제안을 하기 전에 그걸 먼저 읽으세요.

---

## 9. UX 라이팅 (토스 보이스톤)

모든 사용자 노출 문구에 적용합니다.

| 규칙                 | 예                                                    |
| -------------------- | ----------------------------------------------------- |
| 해요체               | 맥락 불문하고 전부                                    |
| 능동형               | "저장되었습니다" ❌ → "앨범에 저장했어요" ✅          |
| 긍정형               | "저장 실패" ❌ → "잠시 뒤에 다시 저장할 수 있어요" ✅ |
| 캐주얼 경어          | "~하시겠어요?" ❌ / "~께" ❌                          |
| 다이얼로그 왼쪽 버튼 | "취소" ❌ → **"닫기"** ✅                             |
| 명사+명사 금지       | 한자어는 동사로 풀어쓰기                              |

확정 문구는 `PLAN.md` 3.2에 있습니다. 새 문구가 필요하면 그 표의 톤을 따르세요.

---

## 10. 개발 순서

| Day | 작업                                       | 완료 판정                         |
| --- | ------------------------------------------ | --------------------------------- |
| D0  | 프로젝트 세팅, 실기기 진입                 | 토스 앱에 화면이 뜬다             |
| D1  | 앨범에서 사진 1장 불러와 표시              | 실기기에서 내 사진이 보인다       |
| D2  | canvas 합성 이미지를 저장 + 저장 위치 확인 | 기기에서 저장 결과를 찾을 수 있다 |
| D3  | 탭 → 정규화 좌표로 뱃지 생성               | 확대해도 같은 위치에 붙어 있다    |
| D4  | 뱃지 드래그 이동, 길게 눌러 삭제           | 손가락을 따라 움직인다            |
| D5  | 설명 입력 바텀시트, 하단 목록              | 목록이 번호 순으로 보인다         |
| D6  | 사진+뱃지+목록 canvas 합성                 | 저장 이미지에 전부 찍혀 있다      |
| D7  | TDS 적용, 문구 반영, 내비게이션바 조정     | 토스 화면처럼 보인다              |
| D8  | 배너 광고, 로고, 다크패턴 점검             | 체크리스트 전항목 통과            |
| D9  | 실기기 3종 테스트, `ait build`             | 깨지는 화면 없음                  |
| D10 | 심사 제출                                  | —                                 |

**D1과 D2가 이 프로젝트의 관문입니다.** 여기가 안 되면 앱이 성립하지 않으므로 다른 작업보다 먼저 뚫으세요.

---

## 11. 테스트

### 브라우저에서 SDK가 돌아갑니다 (중요)

`@apps-in-toss/devtools` 플러그인이 **SDK 전체를 mock으로 바꿔치기**합니다.
따라서 "SDK 기능은 브라우저에서 테스트 불가"는 사실이 아닙니다.

화면 우하단 파란 **AIT** 버튼 → 패널이 열립니다.

| 탭              | 쓰는 법                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| **Device**      | `Photos` 모드를 `mock`(가짜 이미지) → **`web`**(파일 선택 창)으로 바꾼다 |
| **Permissions** | `photos`를 `denied`로 바꿔 **권한 거부 경로를 브라우저에서 테스트**한다  |

환경 판별은 `Environment.deploymentId === 'mock-deployment-id'` 입니다
(`isSupported()`는 환경 판별이 아니라 "이 SDK 빌드에 API가 있나"라서 브라우저에서도 true).

### 그래도 실기기에서만 드러나는 것

- **앨범 응답의 실제 데이터 모양** — mock은 항상 data URI를 주지만 실기기는 아닙니다. 위 3절 참고
- 이미지 저장의 실제 저장 위치
- TDS 컴포넌트 렌더링. 크롬에서 깨져 보여도 정상입니다
- 테스트 환경에서 이미지 저장이 실패해도 실제 배포 앱에서는 정상 동작하는 사례가 보고돼 있습니다.
  **테스트 환경에서 저장이 안 된다고 코드를 대대적으로 고치지 마세요.** 먼저 환경 문제인지 확인합니다.

---

## 12. 작업 방식

- **범위를 늘리는 제안을 하지 마세요.** "이것도 있으면 좋겠는데요"는 v2 후보로만 기록합니다.
- 아키텍처를 **미리** 일반화하지 마세요. 추상화 레이어, 커스텀 훅 남발, 폴더 구조 과설계 전부 불필요합니다.
  단 이미 커진 파일을 쪼개는 건 다릅니다 — 7번의 파일 구조가 그렇게 나왔습니다(D-019).
  기준은 "나중에 필요할 것 같아서"가 아니라 **"지금 한 파일이 성격이 다른 일을 여러 개 하고 있어서"**입니다.
- 판단이 필요한 결정을 내렸으면 `DECISIONS.md`에 **상황 / 대안 / 선택 / 대가** 4줄로 남기세요.
- 앱인토스 관련해서 **확신이 없으면 추측하지 말고 "모르겠다"고 말하고 확인 방법을 제시하세요.**
  잘못된 API 이름으로 만든 코드는 디버깅에 몇 시간이 듭니다.

---

## 13. 참고 문서

- `PLAN.md` — 범위, 콘솔 등록 정보, 확정 문구, 미확인 항목
- `DECISIONS.md` — 결정 기록
- 앱인토스 개발자센터: https://developers-apps-in-toss.toss.im
- 개발자 커뮤니티: https://techchat-apps-in-toss.toss.im
