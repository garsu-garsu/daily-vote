import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "daily-vote",
  brand: {
    displayName: "오늘의 다수결", // 화면에 노출될 앱의 한글 이름
    primaryColor: "#3182F6", // 토스 블루 기반 기본 색상
    icon: "https://static.toss.im/appsintoss/13203/20210dfe-27e2-4af5-912b-49087a57c4be.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
