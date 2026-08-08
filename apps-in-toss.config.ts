import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "daily-vote",
  brand: {
    primaryColor: "#3182F6", // 토스 블루 기반 기본 색상
  },
  permissions: [],
  webBundleDir: "dist",
});
