export type Screen = "home" | "tagging" | "done";

/** 앨범에서 고른 사진. width/height는 화면 크기가 아니라 자연 크기(합성 기준 좌표계). */
export type Photo = {
  dataUri: string;
  width: number;
  height: number;
};

/** x, y는 반드시 0~1 정규화 비율. 화면 픽셀 좌표를 넣지 말 것. */
export type Tag = {
  id: string;
  x: number;
  y: number;
  label: string;
};

/**
 * 뱃지 색. 화면과 합성 이미지가 같은 값을 씁니다.
 *
 * 프리셋(물건 상태 / 그냥 이름표) 2종이 있었지만 없앴습니다. 색과 안내 문구만
 * 달라서 눌러도 티가 나지 않았고, 무엇이 바뀌는지 알 수 없는 선택지는
 * 사용자를 헷갈리게 할 뿐이었습니다. (DECISIONS D-026)
 */
export const BADGE_COLOR = "#FF6B00";
