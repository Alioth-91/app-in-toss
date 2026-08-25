/**
 * SDK 호출을 여기 한 곳에만 둡니다.
 *
 * 브라우저에서는 `@apps-in-toss/devtools` 플러그인이 SDK를 mock으로 바꿔치기해서
 * 앨범은 파일 선택 창으로, 저장은 다운로드로 동작합니다. 따로 우회 코드를 짤 필요가 없습니다.
 */
import {
  Device,
  Environment,
  File,
  FetchAlbumPhotosPermissionError,
} from "@apps-in-toss/web-framework";
import type { Photo } from "../types";

/** 브라우저에서 devtools mock으로 돌고 있는지. 실기기 배포본에서는 실제 배포 ID가 들어옵니다. */
export const isMockEnv = Environment.deploymentId === "mock-deployment-id";

export type PickResult =
  | { status: "ok"; photo: Photo }
  | { status: "cancelled" }
  | { status: "denied" }
  | { status: "error"; error: unknown };

/**
 * 앨범 응답을 `<img>`가 읽을 수 있는 형태로 맞춥니다.
 *
 * `base64: true`를 줘도 **`data:` 접두사가 붙지 않습니다.** 실기기(Android)에서 `/9j/4AAQ...`
 * 형태의 순수 base64로 확인했습니다. 그대로 `<img src>`에 넣으면 로드에 실패합니다.
 */
function toDataUri(raw: string): string {
  if (raw.startsWith("data:")) {
    return raw;
  }
  if (/^[A-Za-z0-9+/=\s]+$/.test(raw.slice(0, 120))) {
    return `data:image/jpeg;base64,${raw}`;
  }
  return raw;
}

/** dataUri에서 자연 크기를 읽어옵니다. 합성(6번)의 기준 좌표계라 여기서 반드시 확보합니다. */
function measure(dataUri: string): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ dataUri, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
    img.src = dataUri;
  });
}

/**
 * 앨범에서 사진 1장 고르기.
 *
 * `Device.getPhotos`는 호출 시 권한을 먼저 요청하고, 거부되면
 * `FetchAlbumPhotosPermissionError`를 던집니다. 권한 처리를 우리가 짤 필요가 없습니다.
 */
export async function pickPhoto(): Promise<PickResult> {
  try {
    const photos = await Device.getPhotos({
      maxCount: 1,
      // 기본값 1024는 합성 결과가 흐릿해집니다. 실기기에서 메모리 문제가 생기면 낮추세요.
      maxWidth: 2048,
      // 필수입니다. 끄면 `dataUri`가 data URI가 아니라 토스 앱 캐시의 file:// 경로로 옵니다.
      // WebView는 https origin에서 그 파일을 못 읽어 이미지 로드가 실패합니다. (실기기 확인)
      base64: true,
    });

    const first = photos[0];

    if (first == null) {
      return { status: "cancelled" };
    }

    return { status: "ok", photo: await measure(toDataUri(first.dataUri)) };
  } catch (error) {
    if (error instanceof FetchAlbumPhotosPermissionError) {
      return { status: "denied" };
    }

    if (isMockEnv && isMockCancel(error)) {
      return { status: "cancelled" };
    }

    return { status: "error", error };
  }
}

/**
 * devtools mock 전용 취소 판별.
 *
 * 브라우저 `<input type="file">`은 취소 이벤트가 없어서, mock이 window focus + 300ms
 * 타임아웃으로 취소를 추정해 Error를 던집니다. 실기기는 취소하면 빈 배열을 주므로
 * (SDK에 취소용 에러 코드 자체가 없습니다) 이 처리는 mock일 때만 적용합니다.
 *
 * 메시지 문자열에 의존하는 건 깨지기 쉽지만, 개발 환경에서만 도는 코드라 감수합니다.
 */
function isMockCancel(error: unknown): boolean {
  const message = (error as { message?: string })?.message ?? "";

  return /cancelled|No files selected/i.test(message);
}

/**
 * 합성 이미지를 기기에 저장합니다.
 *
 * `saveBase64Data`가 아니라 `File.saveBase64`를 씁니다. 전자는 토스 앱 버전이 낮으면
 * console.warn만 남기고 **조용히 아무것도 안 합니다** — 저장이 안 됐는데 "저장했어요"가
 * 뜨게 됩니다. 후자는 같은 상황에서 에러를 던져서 우리가 알아챌 수 있습니다.
 *
 * ⚠️ 이게 앨범(사진첩)에 저장되는지는 아직 미확인
 */
export async function saveImage(
  dataUrl: string,
  fileName: string,
): Promise<void> {
  const [head, data] = dataUrl.split(",");
  const mimeType = head.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";

  await File.saveBase64({ data, fileName, mimeType });
}
