import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "settlement-table",
  brand: {
    primaryColor: "#3182F6",
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withTitle: true,
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsBackForwardNavigationGestures: false,
  },
  webBundleDir: "dist",
});
