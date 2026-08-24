import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "kokkok-app",
  brand: {
    primaryColor: "#3182F6", // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
  },
  permissions: [
    { name: "photos", access: "read" },
    { name: "photos", access: "write" },
  ],
  navigationBar: {
    withBackButton: true,
    withTitle: true,
  },
  webView: {
    bounces: false, // 드래그와 충돌 방지
    pullToRefreshEnabled: false, // 위로 스와이프 시 새로고침 방지
    overScrollMode: "never", // Android 동일
    allowsBackForwardNavigationGestures: false, // iOS 엣지 스와이프 방지
  },
  webBundleDir: "dist",
});
