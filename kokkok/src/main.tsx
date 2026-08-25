import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import "./index.css";
import App from "./App.tsx";

/**
 * TDS는 색을 CSS 변수(`var(--adaptiveBackground)` 등)로 씁니다.
 * 그 변수를 정의하는 건 `@toss/tds-mobile-ait`(→ `@toss/tds-colors`)이고,
 * `@toss/tds-mobile` 단독으로는 아무 색도 정의되지 않아 배경이 투명해집니다.
 *
 * TDSMobileAITProvider가 TDSMobileProvider를 감싸면서 userAgent와
 * 브랜드 색(apps-in-toss.config.ts의 brand.primaryColor)까지 알아서 넣어줍니다.
 * 그래서 userAgent를 직접 만들 필요가 없습니다.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider>
      <App />
    </TDSMobileAITProvider>
  </StrictMode>,
);
