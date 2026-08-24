/**
 * canvas 합성. SDK를 모르는 순수 함수라 크롬에서 반복 확인할 수 있습니다.
 *
 * 사진 + 번호 뱃지를 합성합니다.
 * 하단 설명 목록은 6번에서 이 파일에 넣습니다.
 */
import { PRESETS } from "./types";
import type { Photo, PresetKey, Tag } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
    img.src = src;
  });
}

/**
 * 저장 포맷은 JPEG 0.92입니다.
 *
 * 사진이 주 콘텐츠라 PNG는 파일이 3~5배 커지고, 메모리 제약이 있는 WebView에서 불리합니다.
 * 6번에서 하단 설명 텍스트가 뭉개져 보이면 그때 PNG로 바꿉니다.
 *
 * 하단 설명 목록은 아직 없습니다. 6번에서 넣습니다.
 */
export async function composeImage(
  photo: Photo,
  tags: Tag[],
  preset: PresetKey,
): Promise<string> {
  const img = await loadImage(photo.dataUri);

  const canvas = document.createElement("canvas");
  canvas.width = photo.width;
  canvas.height = photo.height;

  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("canvas를 만들지 못했어요");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 뱃지 크기를 고정 px로 잡으면 사진 크기마다 달라 보입니다. 반드시 비율로.
  const radius = canvas.width * 0.035;

  tags.forEach((tag, index) => {
    // 0~1 비율을 원본 픽셀로 되돌립니다. 화면 크기와 무관하게 같은 지점이 나옵니다.
    const cx = tag.x * canvas.width;
    const cy = tag.y * canvas.height;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = PRESETS[preset].badgeColor;
    ctx.fill();
    ctx.lineWidth = radius * 0.14;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = `700 ${radius * 1.1}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), cx, cy);
  });

  return canvas.toDataURL("image/jpeg", 0.92);
}
