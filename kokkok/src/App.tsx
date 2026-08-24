import { useState } from "react";
import Home from "./Home";
import Tagging from "./Tagging";
import { isMockEnv, pickPhoto, saveImage } from "./bridge";
import { composeImage } from "./compose";
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

  function handleAddTag(x: number, y: number) {
    setTags((prev) => [
      ...prev,
      { id: crypto.randomUUID(), x, y, label: "" },
    ]);
  }

  async function handleSave() {
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
  }

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
