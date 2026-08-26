import { useEffect, useRef } from "react";
import { graniteEvent } from "@apps-in-toss/web-framework";

/**
 * 토스 뒤로가기를 가로챕니다.
 *
 * ⚠️ **구독하는 순간 토스 기본 동작(미니앱 종료)이 차단됩니다.** 공식 문서에
 * "기본 뒤로가기는 차단돼요"라고 명시돼 있습니다. 그래서 구독을 떼지 않으면
 * 앱이 영영 안 꺼지고, "최초 화면에서 뒤로가기를 누르면 미니앱이 종료됨"
 * 심사 항목에 걸립니다.
 *
 * 따라서 **뒤로가기를 가로채야 하는 화면에서만** 이 훅을 씁니다.
 * 홈 화면은 구독하지 않아 기본 종료 동작이 그대로 살아 있습니다.
 *
 * TDS의 `closeOnBackEvent`를 쓰지 않는 이유: 그 옵션은 프로바이더가 넣어준
 * backEvent 객체에 의존하는데, `@toss/tds-mobile-ait`는 그걸 넣어주지 않습니다.
 * 켜도 아무 일이 일어나지 않습니다.
 */
export function useBackEvent(onBack: () => void): void {
  /**
   * 구독은 한 번만 걸고 핸들러만 갈아끼웁니다.
   * onBack이 바뀔 때마다 재구독하면 그 찰나에 기본 종료 동작이 되살아납니다.
   */
  const handlerRef = useRef(onBack);

  useEffect(() => {
    handlerRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    return graniteEvent.addEventListener("backEvent", {
      onEvent: () => handlerRef.current(),
      onError: (error) => {
        console.error("[kokkok] 뒤로가기를 처리하지 못했어요", error);
      },
    });
  }, []);
}
