import { useState } from "react";
import Home from "./screens/Home";
import Tagging from "./screens/Tagging";
import { isMockEnv, pickPhoto, saveImage } from "./lib/bridge";
import { composeImage } from "./lib/compose";
import type { Photo, PresetKey, Screen, Tag } from "./types";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [preset, setPreset] = useState<PresetKey>("condition");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePick() {
    setLoading(true);
    setMessage(null);

    const result = await pickPhoto();

    setLoading(false);

    switch (result.status) {
      case "ok":
        setPhoto(result.photo);
        setTags([]);
        setScreen("tagging");
        break;
      case "denied":
        setMessage("앨범을 허용하면 사진을 고를 수 있어요");
        break;
      case "cancelled":
        break;
      case "error":
        console.error("[kokkok] 사진을 불러오지 못했어요", result.error);
        setMessage("잠시 뒤에 다시 고를 수 있어요");
        break;
    }
  }

  const handleAddTag = (x: number, y: number) => {
    setTags((prev) => [...prev, { id: crypto.randomUUID(), x, y, label: "" }]);
  };

  /** x, y는 Tagging에서 이미 0~1로 정규화해 넘어옵니다. */
  const handleMoveTag = (id: string, x: number, y: number) => {
    setTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, x, y } : tag)),
    );
  };

  const handleLabelTag = (id: string, label: string) => {
    setTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, label } : tag)),
    );
  };

  /**
   * 번호는 배열 순서로 매기므로, 가운데를 지우면 뒤 번호가 당겨집니다.
   * 하단 설명 목록과 1:1로 맞아야 하기 때문에, id로 찾아서 지웁니다.
   */
  const handleDeleteTag = (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  };

  const handleSave = async () => {
    if (photo == null) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const dataUrl = await composeImage(photo, tags, preset);
      // 공유 시트를 띄우고 바로 반환합니다. 사용자가 저장했는지 취소했는지 알 수 없으므로
      // 성공 문구를 띄우지 않습니다. (DECISIONS D-014)
      await saveImage(dataUrl, `kokkok-${Date.now()}.jpg`);
    } catch (error) {
      console.error("[kokkok] 저장하지 못했어요", error);
      setMessage("잠시 뒤에 다시 만들 수 있어요");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {screen === "home" || photo == null ? (
        <Home
          preset={preset}
          loading={loading}
          message={message}
          photo={photo}
          onChangePreset={setPreset}
          onPick={handlePick}
        />
      ) : (
        <Tagging
          photo={photo}
          preset={preset}
          onBack={() => setScreen("home")}
          tags={tags}
          onAddTag={handleAddTag}
          onMoveTag={handleMoveTag}
          onLabelTag={handleLabelTag}
          onDeleteTag={handleDeleteTag}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {isMockEnv && (
        <p className="devnote">
          브라우저 mock 모드 — 실제 SDK 동작은 실기기에서 확인하세요
        </p>
      )}
    </>
  );
}
