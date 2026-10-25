import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, SESSION_COOKIE, verifyDemoToken, verifySessionToken } from "./app/lib/session";

// 每個請求進來前先檢查登入 cookie：沒登入就導到登入頁，已登入就不用再看登入頁。示範模式也算登入。
// 這只是初步過濾，Server Action 裡會再用 requireLogin() 確認一次。
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const loggedIn =
    verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value) ||
    verifyDemoToken(request.cookies.get(DEMO_COOKIE)?.value);
  const isLoginPage = pathname === "/login";
  // 不用登入就能看的頁面：登入頁和「關於這個作品」
  const isPublic = isLoginPage || pathname === "/about";

  if (!loggedIn && !isPublic) {
    const url = new URL("/login", request.url);
    // 登入後回到原本要去的頁面
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (loggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 不檢查的：Next.js 的靜態檔、圖片最佳化，以及有副檔名的檔案（favicon、之後 PWA 的圖示等）
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
