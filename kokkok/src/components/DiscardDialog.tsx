import { ConfirmDialog } from "@toss/tds-mobile";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * 다른 사진을 고르기 직전에 뜨는 확인창.
 *
 * **표시가 실제로 사라지는 지점은 여기 하나뿐입니다.** 뒤로가기로 홈에 나가는 건
 * 사진과 표시를 그대로 들고 나가는 것이라 아무것도 잃지 않고, 그래서 확인창을
 * 띄우지 않습니다 — 잃을 게 없는데 막아서면 "뒤로가기 이탈 방지" 다크패턴입니다.
 * (DECISIONS D-024)
 *
 * 왼쪽이 '닫기'인 건 토스 보이스톤 규칙입니다. '취소'는 쓰지 않습니다.
 */
export default function DiscardDialog({ open, onClose, onConfirm }: Props) {
  return (
    <ConfirmDialog
      open={open}
      title="지금 만든 표시는 사라져요"
      onClose={onClose}
      cancelButton={
        <ConfirmDialog.CancelButton onClick={onClose}>
          닫기
        </ConfirmDialog.CancelButton>
      }
      confirmButton={
        <ConfirmDialog.ConfirmButton onClick={onConfirm}>
          사진 고르기
        </ConfirmDialog.ConfirmButton>
      }
    />
  );
}
