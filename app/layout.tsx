import type { Metadata, Viewport } from "next";
import { Noto_Serif_JP, Source_Serif_4 } from "next/font/google";
import DemoBanner from "./components/DemoBanner";
import { HTML_LANG } from "./i18n";
import { I18nProvider } from "./i18n/client";
import { getLocale, getT } from "./i18n/server";
import { isLoggedIn } from "./lib/auth";
import { isDemo } from "./lib/demo-session";
import { getSettings } from "./lib/profile-store";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-en",
  subsets: ["latin"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-ja",
  subsets: ["latin"],
});

// 說明文字跟著目前語言，所以用 generateMetadata 在每次請求時產生
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Kotae",
    description: t.meta.tagline,
    // iPhone / iPad「加入主畫面」：用自己的圖示和名稱，打開時全螢幕（沒有 Safari 網址列）
    appleWebApp: { capable: true, title: "Kotae", statusBarStyle: "default" },
    // 有寫 icons 時 Next.js 不會自動加 app/icon.svg，所以分頁小圖示也要寫在這裡
    icons: { icon: { url: "/icon.svg", type: "image/svg+xml" }, apple: "/icons/apple-touch-icon.png" },
  };
}

export const viewport: Viewport = {
  themeColor: "#F5F2EA",
  // 讓畫面延伸到瀏海和底部橫條的位置，各頁用 env(safe-area-inset-*) 留白
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 主題顏色存在資料庫（設定頁切換），產生頁面時就套用，才不會先閃一下別的顏色。
  // 登入頁還沒登入，不查資料庫，用預設的米白墨色。
  const demo = await isDemo();
  const theme = (await isLoggedIn()) || demo ? (await getSettings()).theme : "ink";
  const locale = await getLocale();

  return (
    <html
      lang={HTML_LANG[locale]}
      data-theme={theme}
      className={`${sourceSerif.variable} ${notoSerifJP.variable}`}
    >
      {/* 瀏覽器擴充功能（如 Monica）會在 body 加屬性，忽略這層的 hydration 差異 */}
      <body suppressHydrationWarning>
        <I18nProvider locale={locale}>
          {demo && <DemoBanner />}
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
