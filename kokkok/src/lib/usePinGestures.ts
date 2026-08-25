import { useRef } from "react";

/**
 * 사진 위 번호 뱃지의 손가락 조작을 한곳에 모은 훅입니다.
 *
 * 다루는 것
 * - 화면 좌표 → 0~1 정규화ㅇ
 * - 탭과 드래그를 8px로 가르기
 * - 포인터 캡처
 * - 시트를 pointerup이 아니라 click에서 여는 이유
 */

/**
 * 이만큼 넘게 움직이면 탭이 아니라 드래그로 봅니다.
 * 손가락은 가만히 눌러도 2~3px은 흔들립니다.
 */
const DRAG_THRESHOLD_PX = 8;

type Params = {
  /** 좌표 기준이 되는 `<img>`. 컨테이너를 주면 여백만큼 밀립니다. */
  imgRef: React.RefObject<HTMLImageElement | null>;
  onAddTag: (x: number, y: number) => void;
  onMoveTag: (id: string, x: number, y: number) => void;
  onOpenTag: (id: string) => void;
};

export function usePinGestures({
  imgRef,
  onAddTag,
  onMoveTag,
  onOpenTag,
}: Params) {
  /** 사진 빈 곳을 누른 지점. 뗄 때 탭인지 판정하려고 들고 있습니다. */
  const tapRef = useRef<{ x: number; y: number } | null>(null);

  /** 지금 끌고 있는 뱃지. 렌더와 무관하므로 state가 아니라 ref입니다. */
  const dragRef = useRef<{
    id: string;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);

  /** 뗄 때 탭으로 판정된 뱃지. 뒤이어 오는 click에서 시트를 엽니다. */
  const pendingOpenRef = useRef<string | null>(null);

  /**
   * 화면 좌표를 0~1 비율로 바꿉니다. 화면 픽셀을 그대로 저장하면
   * 합성할 때 위치가 어긋납니다. (CLAUDE.md 6번)
   *
   * @param clamp 사진 밖으로 나간 좌표를 가장자리로 당길지 여부.
   *   드래그는 당기고(손가락이 사진 밖으로 나가도 뱃지는 남음),
   *   새 뱃지 추가는 당기지 않고 무시합니다(사진 밖을 누른 것이므로).
   */
  function toRatio(event: React.PointerEvent, clamp: boolean) {
    const img = imgRef.current;
    if (img == null) {
      return null;
    }

    const rect = img.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (clamp) {
      return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
    }

    if (x < 0 || x > 1 || y < 0 || y > 1) {
      return null;
    }

    return { x, y };
  }

  function movedFar(from: { x: number; y: number }, event: React.PointerEvent) {
    return (
      Math.hypot(event.clientX - from.x, event.clientY - from.y) >
      DRAG_THRESHOLD_PX
    );
  }

  /**
   * 새 뱃지는 누를 때가 아니라 **뗄 때** 만듭니다.
   * 누를 때 만들면 뱃지를 끌고 지나간 자리마다 뱃지가 생깁니다.
   */
  const area = {
    onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
      tapRef.current = { x: event.clientX, y: event.clientY };
    },

    onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
      const start = tapRef.current;
      tapRef.current = null;

      if (start == null || movedFar(start, event)) {
        return;
      }

      const point = toRatio(event, false);
      if (point == null) {
        return;
      }

      onAddTag(point.x, point.y);
    },
  };

  function badge(id: string) {
    return {
      onPointerDown(event: React.PointerEvent<HTMLSpanElement>) {
        // 이 이벤트가 사진 영역까지 올라가면 뱃지 위에 새 뱃지가 생깁니다.
        event.stopPropagation();

        // 캡처를 걸어야 손가락이 사진 밖으로 나가도 move/up이 계속 옵니다.
        event.currentTarget.setPointerCapture(event.pointerId);

        dragRef.current = {
          id,
          x: event.clientX,
          y: event.clientY,
          moved: false,
        };
      },

      onPointerMove(event: React.PointerEvent<HTMLSpanElement>) {
        const drag = dragRef.current;
        if (drag == null) {
          return;
        }

        // 문턱을 넘기 전에는 움직이지 않습니다. 탭하려다 살짝 흔들린 것까지
        // 이동으로 처리하면 뱃지가 미세하게 밀립니다.
        if (!drag.moved && !movedFar(drag, event)) {
          return;
        }

        drag.moved = true;

        const point = toRatio(event, true);
        if (point == null) {
          return;
        }

        onMoveTag(drag.id, point.x, point.y);
      },

      /**
       * 끌지 않고 톡 뗐으면 설명을 입력하려는 것입니다.
       *
       * 다만 여기서 바로 열지 않고 표시만 해둡니다. pointerup 직후 브라우저가
       * 같은 자리에 click을 한 번 더 쏘는데, 그 사이 딤이 깔려 있으면 딤이 그 클릭을
       * 받아 시트를 즉시 닫아버립니다. click에서 열면 딤은 이 클릭을 못 받습니다.
       */
      onPointerUp(event: React.PointerEvent<HTMLSpanElement>) {
        event.stopPropagation();

        const drag = dragRef.current;
        dragRef.current = null;

        pendingOpenRef.current = drag == null || drag.moved ? null : drag.id;
      },

      onPointerCancel(event: React.PointerEvent<HTMLSpanElement>) {
        event.stopPropagation();
        dragRef.current = null;
        pendingOpenRef.current = null;
      },

      onClick(event: React.MouseEvent<HTMLSpanElement>) {
        event.stopPropagation();

        const pending = pendingOpenRef.current;
        pendingOpenRef.current = null;

        if (pending != null) {
          onOpenTag(pending);
        }
      },

      // 실기기에서 길게 누를 때 뜨는 OS 메뉴를 막습니다.
      onContextMenu(event: React.MouseEvent<HTMLSpanElement>) {
        event.preventDefault();
      },
    };
  }

  return { area, badge };
}
