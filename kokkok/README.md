# 콕콕 (kokkok)

사진 위에 번호를 콕 찍고 설명을 붙여, 한 장의 이미지로 저장하는 [앱인토스](https://developers-apps-in-toss.toss.im) 미니앱.

**대표 사용 상황:** 중고로 물건을 팔 때 "여기 긁혔어요"를 사진 위에 표시해서 거래 앱에 올린다.

```
[홈]  ──사진 고르기──▶  [태깅]  ──이미지로 저장하기──▶  [완료]
                          │
                     (뱃지 탭 → 설명 입력 바텀시트)
```

## 문서

| 파일                                     | 내용                                     |
| ---------------------------------------- | ---------------------------------------- |
| [.claude/CLAUDE.md](./.claude/CLAUDE.md) | 작업 규칙 — 코드를 건드리기 전에 읽을 것 |

## 개발

```bash
npm install
npm run dev      # vite 개발 서버
npm run build    # tsc → vite build → ait build
npm run deploy   # ait deploy
npm run lint
```

**주의:** 앨범 접근·이미지 저장 같은 SDK 기능과 TDS 컴포넌트는 **브라우저에서 테스트되지 않습니다.**
실기기(샌드박스 또는 콘솔 QR)에서 확인하세요. 자세한 내용은 CLAUDE.md 11번.

## 스택

Vite 8 · React 18 · TypeScript · `@apps-in-toss/web-framework` 3.x · `@toss/tds-mobile` 2.x
서버 없음 / DB 없음 / 로그인 없음 — 모든 처리는 기기 안에서 이루어집니다.
