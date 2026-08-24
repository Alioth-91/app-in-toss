import { useRef } from "react";
import { PRESETS } from "./types";
import type { Photo, PresetKey, Tag } from "./types";

type Props = {
  photo: Photo;
  preset: PresetKey;
  tags: Tag[];
  onAddTag: (x: number, y: number) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
};

export default function Tagging({
  photo,
  preset,
  tags,
  onAddTag,
  onBack,
  onSave,
  saving,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  /**
   * 화면 좌표를 0~1 비율로 바꿔서 넘깁니다. 화면 픽셀을 그대로 저장하면
   * 합성할 때 위치가 어긋납니다. (CLAUDE.md 6번)
   *
   * 기준은 `<img>` 요소의 rect입니다. 컨테이너 rect를 쓰면 여백만큼 밀립니다.
   */
  function handleTap(event: React.PointerEvent<HTMLDivElement>) {
    const img = imgRef.current;
    if (img == null) {
      return;
    }

    const rect = img.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // 가장자리를 정확히 누르면 0 미만이나 1 초과가 나올 수 있습니다.
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      return;
    }

    onAddTag(x, y);
  }

  return (
    <div className="screen">
      <div className="body">
        <p className="sub">
          {tags.length === 0
            ? "사진을 톡 누르면 표시가 생겨요"
            : `표시 ${tags.length}개를 찍었어요`}
        </p>

        <div className="stage">
          <div className="pinArea" onPointerDown={handleTap}>
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
              >
                {index + 1}
              </span>
            ))}
          </div>
        </div>

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
        <button type="button" className="secondary spaced" onClick={onBack}>
          사진 다시 고르기
        </button>
      </div>
    </div>
  );
}
