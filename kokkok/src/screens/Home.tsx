import type { Photo, PresetKey } from "../types";
import { PRESETS } from "../types";

type Props = {
  preset: PresetKey;
  loading: boolean;
  message: string | null;
  photo: Photo | null;
  onChangePreset: (preset: PresetKey) => void;
  onPick: () => void;
};

export default function Home({
  preset,
  loading,
  message,
  photo,
  onChangePreset,
  onPick,
}: Props) {
  return (
    <div className="screen">
      <div className="body">
        <h1 className="headline">사진에 콕 찍어서 알려주세요</h1>

        <p className="sub">흠집이 있는 곳을 사진 위에 바로 표시할 수 있어요</p>

        <div className="presets">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={`preset ${preset === key ? "on" : ""}`}
              style={
                preset === key
                  ? { borderColor: PRESETS[key].badgeColor }
                  : undefined
              }
              onClick={() => onChangePreset(key)}
            >
              <span
                className="dot"
                style={{ background: PRESETS[key].badgeColor }}
              />

              {PRESETS[key].title}
            </button>
          ))}
        </div>

        <div className="preview">
          {photo == null ? (
            <p className="empty">사진을 고르면 여기에 보여요</p>
          ) : (
            <img src={photo.dataUri} alt="" />
          )}
        </div>

        {message != null && <p className="message">{message}</p>}
      </div>

      <div className="cta">
        <button
          type="button"
          className="primary"
          onClick={onPick}
          disabled={loading}
        >
          {loading ? "사진을 불러오고 있어요" : "사진 고르기"}
        </button>
      </div>
    </div>
  );
}
