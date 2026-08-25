export type Screen = 'home' | 'tagging' | 'done';

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

export type PresetKey = 'condition' | 'nameplate';

export const PRESETS: Record<
  PresetKey,
  { title: string; badgeColor: string; placeholder: string; sheetTitle: string }
> = {
  condition: {
    title: '물건 상태 표시',
    badgeColor: '#FF6B00',
    placeholder: '예: 오른쪽 아래 살짝 긁힘',
    sheetTitle: '어떤 흠집인가요?',
  },
  nameplate: {
    title: '그냥 이름표',
    badgeColor: '#3182F6',
    placeholder: '예: 이 물건 이름은?',
    sheetTitle: '뭐라고 적을까요?',
  },
};
