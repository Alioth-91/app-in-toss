import { BottomSheet, Button, TextField } from "@toss/tds-mobile";

type Props = {
  open: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  onDelete: () => void;
};

/**
 * 한 줄 설명을 입력하는 바텀시트. 삭제도 여기서 합니다.
 *
 * 길게 눌러 삭제하지 않는 이유: 누르는 손가락이 뱃지를 가려서 지워졌는지
 * 보이지 않았습니다. (DECISIONS D-015)
 *
 * 딤을 누르거나 뒤로가기를 하면 쓰던 글을 버리고 닫습니다.
 * TDS가 권장하는 동작이고, 나갈 방법이 늘 열려 있어야 하는 심사 기준과도 맞습니다.
 */
export default function LabelSheet({
  open,
  draft,
  onDraftChange,
  onClose,
  onConfirm,
  onDelete,
}: Props) {
  return (
    <BottomSheet open={open} onDimmerClick={onClose} hasTextField>
      <BottomSheet.Header>어떤 흠집인가요?</BottomSheet.Header>
      <BottomSheet.HeaderDescription>
        한 줄로 짧게 써요
      </BottomSheet.HeaderDescription>

      <TextField
        variant="box"
        value={draft}
        placeholder="예: 오른쪽 아래 살짝 긁힘"
        onChange={(event) => onDraftChange(event.target.value)}
      />

      <BottomSheet.DoubleCTA
        leftButton={
          <Button color="light" onClick={onDelete}>
            삭제
          </Button>
        }
        rightButton={<Button onClick={onConfirm}>확인</Button>}
      />
    </BottomSheet>
  );
}
