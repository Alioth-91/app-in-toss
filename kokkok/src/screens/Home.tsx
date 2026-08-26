import { useState } from "react";
import DiscardDialog from "../components/DiscardDialog";
import type { Photo } from "../types";

type Props = {
  loading: boolean;
  message: string | null;
  photo: Photo | null;
  tagCount: number;
  onPick: () => void;
  onResume: () => void;
};

export default function Home({
  loading,
  message,
  photo,
  tagCount,
  onPick,
  onResume,
}: Props) {
  /** 다른 사진을 고르면 표시가 사라지므로 한 번 확인합니다. */
  const [discarding, setDiscarding] = useState(false);

  /** 찍어둔 표시가 없으면 잃을 것도 없으니 바로 앨범을 엽니다. */
  function requestPick() {
    if (tagCount === 0) {
      onPick();
      return;
    }
    setDiscarding(true);
  }

  return (
    <div className="screen">
      <div className="body">
        <h1 className="headline">사진에 콕 찍어서 알려주세요</h1>

        <p className="sub">흠집이 있는 곳을 사진 위에 바로 표시할 수 있어요</p>

        <div className="preview">
          {photo == null ? (
            <p className="empty">사진을 고르면 여기에 보여요</p>
          ) : (
            <img src={photo.dataUri} alt="" />
          )}
        </div>

        {message != null && <p className="message">{message}</p>}
      </div>

      {/*
        고르던 사진이 남아 있으면 이어서 하는 게 기본 행동입니다.
        뒤로가기로 나와도 사진과 표시가 그대로 보관되기 때문에,
        여기로 다시 들어갈 길이 없으면 작업이 갇힙니다. (DECISIONS D-024)
      */}
      <div className="cta">
        {photo == null ? (
          <button
            type="button"
            className="primary"
            onClick={onPick}
            disabled={loading}
          >
            {loading ? "사진을 불러오고 있어요" : "사진 고르기"}
          </button>
        ) : (
          <>
            <button type="button" className="primary" onClick={onResume}>
              이어서 표시하기
            </button>
            <button
              type="button"
              className="secondary spaced"
              onClick={requestPick}
              disabled={loading}
            >
              {loading ? "사진을 불러오고 있어요" : "다른 사진 고르기"}
            </button>
          </>
        )}
      </div>

      <DiscardDialog
        open={discarding}
        onClose={() => setDiscarding(false)}
        onConfirm={() => {
          setDiscarding(false);
          onPick();
        }}
      />
    </div>
  );
}
