import type { MetadataRoute } from "next";

// PWA 的設定（網址是 /manifest.webmanifest）：手機「加到主畫面」時的名稱、圖示、全螢幕顯示。
// 圖示在 public/icons/，由 scripts/make-icons.mjs 產生。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kotae 答え",
    short_name: "Kotae",
    description: "每日英日面試練習",
    lang: "zh-Hant",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F5F2EA",
    theme_color: "#F5F2EA",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
