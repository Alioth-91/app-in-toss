import { useCallback, useRef, useState } from "react";
import LabelSheet from "../components/LabelSheet";
import TagList from "../components/TagList";
import { useBackEvent } from "../lib/useBackEvent";
import { usePinGestures } from "../lib/usePinGestures";
import { PRESETS } from "../types";
import type { Photo, PresetKey, Tag } from "../types";

type Props = {
  photo: Photo;
  preset: PresetKey;
  tags: Tag[];
  onAddTag: (x: number, y: number) => void;
  onMoveTag: (id: string, x: number, y: number) => void;
  onLabelTag: (id: string, label: string) => void;
  onDeleteTag: (id: string) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
};

export default function Tagging({
  photo,
  preset,
  tags,
  onAddTag,
  onMoveTag,
  onLabelTag,
  onDeleteTag,
  onBack,
  onSave,
  saving,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  /** 설명을 입력하는 중인 뱃지. null이면 바텀시트가 닫혀 있습니다. */
  const [editingId, setEditingId] = useState<string | null>(null);

  /** 입력 중인 글. 확인을 눌러야 tags에 반영합니다. */
  const [draft, setDraft] = useState("");

  function openSheet(id: string) {
    const tag = tags.find((item) => item.id === id);
    setDraft(tag?.label ?? "");
    setEditingId(id);
  }

  function closeSheet() {
    setEditingId(null);
    setDraft("");
  }

  function handleConfirm() {
    if (editingId != null) {
      onLabelTag(editingId, draft.trim());
    }
    closeSheet();
  }

  function handleDelete() {
    if (editingId != null) {
      onDeleteTag(editingId);
    }
    closeSheet();
  }

  /**
   * 토스 뒤로가기는 시트가 열려 있으면 시트만 닫고, 아니면 홈으로 나갑니다.
   *
   * 나갈 때 확인창을 띄우지 않는 이유: 사진과 표시가 그대로 보관되고 홈의
   * '이어서 표시하기'로 되돌아올 수 있어 **아무것도 잃지 않기 때문**입니다.
   * 잃을 게 없는데 막아서면 "뒤로가기 이탈 방지" 다크패턴입니다. (DECISIONS D-024)
   */
  const handleBackEvent = useCallback(() => {
    if (editingId != null) {
      setEditingId(null);
      setDraft("");
      return;
    }
    onBack();
  }, [editingId, onBack]);

  useBackEvent(handleBackEvent);

  const gestures = usePinGestures({
    imgRef,
    onAddTag,
    onMoveTag,
    onOpenTag: openSheet,
  });

  return (
    <div className="screen">
      <div className="body">
        <p className="sub">
          {tags.length === 0
            ? "사진을 톡 누르면 표시가 생겨요"
            : `표시 ${tags.length}개를 찍었어요`}
        </p>

        <div className="stage">
          <div className="pinArea" {...gestures.area}>
            <img ref={imgRef} src={photo.dataUri} alt="" />

            {tags.map((tag, index) => (
              <span
                key={tag.id}
                className="badge"
                style={{
                  left: `${tag.x * 100}%`,
                  top: `${tag.y * 100}%`,
                  background: PRESETS[preset].badgeColor,
                }}
                {...gestures.badge(tag.id)}
              >
                {index + 1}
              </span>
            ))}
          </div>
        </div>

        <TagList tags={tags} preset={preset} onSelect={openSheet} />

        <p className="meta">
          원본 크기 {photo.width} × {photo.height}
        </p>
      </div>

      <div className="cta">
        <button
          type="button"
          className="primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "이미지를 만들고 있어요" : "이미지 내보내기"}
        </button>
      </div>

      <LabelSheet
        open={editingId != null}
        preset={preset}
        draft={draft}
        onDraftChange={setDraft}
        onClose={closeSheet}
        onConfirm={handleConfirm}
        onDelete={handleDelete}
      />
    </div>
  );
}
