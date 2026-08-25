/**
 * canvas 합성. SDK를 모르는 순수 함수라 크롬에서 반복 확인할 수 있습니다.
 *
 * 사진 + 번호 뱃지 + 하단 설명 목록을 한 장으로 만듭니다.
 */
import { PRESETS } from "../types";
import type { Photo, PresetKey, Tag } from "../types";

const FONT_STACK = `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
    img.src = src;
  });
}

/**
 * canvas에는 자동 줄바꿈이 없습니다. 화면 목록도 `text-overflow: ellipsis`로
 * 한 줄만 보여주므로, 저장물도 똑같이 한 줄로 자릅니다.
 * 사용자가 화면에서 본 것과 저장된 것이 달라지면 안 됩니다.
 */
function fitOneLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  let cut = text;
  while (cut.length > 0 && ctx.measureText(cut + "…").width > maxWidth) {
    cut = cut.slice(0, -1);
  }

  return cut + "…";
}

/**
 * 저장 포맷은 JPEG 0.92입니다.
 *
 * 사진이 주 콘텐츠라 PNG는 파일이 3~5배 커지고, 메모리 제약이 있는 WebView에서 불리합니다.
 * 하단 설명 텍스트가 뭉개져 보이면 그때 PNG로 바꿉니다.
 */
export async function composeImage(
  photo: Photo,
  tags: Tag[],
  preset: PresetKey,
): Promise<string> {
  const img = await loadImage(photo.dataUri);

  // 설명이 없는 표시는 목록에서 뺍니다. 빈 줄만 남으면 저장물이 지저분해집니다.
  // 번호는 전체 순번을 그대로 쓰므로 사진 위 뱃지와 어긋나지 않습니다.
  const listed = tags
    .map((tag, index) => ({ tag, number: index + 1 }))
    .filter((item) => item.tag.label !== "");

  // 모든 치수는 사진 폭 기준 비율입니다. 고정 px로 잡으면 사진 크기마다 달라 보입니다.
  const width = photo.width;
  const pad = width * 0.04;
  const fontSize = width * 0.038;
  const rowHeight = fontSize * 2.1;
  const listHeight =
    listed.length === 0 ? 0 : pad * 2 + rowHeight * listed.length;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = photo.height + listHeight;

  const ctx = canvas.getContext("2d");
  if (ctx == null) {
    throw new Error("canvas를 만들지 못했어요");
  }

  ctx.drawImage(img, 0, 0, width, photo.height);

  const badgeColor = PRESETS[preset].badgeColor;

  // 사진 위 번호 뱃지
  const radius = width * 0.035;

  tags.forEach((tag, index) => {
    // 0~1 비율을 원본 픽셀로 되돌립니다. 화면 크기와 무관하게 같은 지점이 나옵니다.
    const cx = tag.x * width;
    const cy = tag.y * photo.height;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = badgeColor;
    ctx.fill();
    ctx.lineWidth = radius * 0.14;
    ctx.strokeStyle = "#fff";
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = `700 ${radius * 1.1}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(index + 1), cx, cy);
  });

  if (listed.length === 0) {
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  // 하단 설명 목록
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, photo.height, width, listHeight);

  const rowBadgeRadius = fontSize * 0.62;
  const textLeft = pad + rowBadgeRadius * 2 + fontSize * 0.5;
  const maxTextWidth = width - textLeft - pad;

  listed.forEach((item, row) => {
    const cy = photo.height + pad + rowHeight * row + rowHeight / 2;

    ctx.beginPath();
    ctx.arc(pad + rowBadgeRadius, cy, rowBadgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = badgeColor;
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = `700 ${rowBadgeRadius * 1.15}px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(item.number), pad + rowBadgeRadius, cy);

    ctx.fillStyle = "#191f28";
    ctx.font = `${fontSize}px ${FONT_STACK}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitOneLine(ctx, item.tag.label, maxTextWidth), textLeft, cy);
  });

  return canvas.toDataURL("image/jpeg", 0.92);
}
