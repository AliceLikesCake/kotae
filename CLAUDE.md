# Kotae（答え）— 給 Claude Code 的專案說明

每日英日面試練習 App。完整規格在 `docs/Kotae-專案規格書.md`，開始任何功能前請先讀它。

## 跟我溝通的方式

- 一律用**繁體中文**回答。
- 我會寫程式、熟悉 MSSQL，但**第一次用 Next.js 和 TypeScript**。新觀念請用一兩句話說明，可以拿 SQL / 一般後端的概念來比喻。
- 一次做一個步驟。改完之後告訴我改了哪些檔案、要怎麼在瀏覽器確認，等我回報再繼續。
- 要安裝新套件前先跟我說要裝什麼、為什麼。

## 開發環境（重要）

- **開發環境（Mac）**：程式碼推到 GitHub。
  - macOS 14.3、Apple 晶片（arm64）。
  - Node v24.21.0（官方 .pkg 安裝），有管理員權限。
  - 終端機是 zsh。
  - 第一次 `npm run dev` 時，下載 Google 字型失敗，出現 `Can't resolve '@vercel/turbopack-next/internal/font/google/font'`。解法：刪掉 `.next` 資料夾再重新啟動。
- **啟動開發伺服器**：`npm run dev`（已在 `package.json` 設定用 webpack，不用預設的 Turbopack）。
- **資料庫**：PostgreSQL。本機用 Docker 跑 PostgreSQL 17（容器 `kotae-pg`，port 5432，資料庫 / 帳號 `kotae`，資料在 Volume `kotae-pg-data`），上線用 Neon（從 Vercel 建立）。
  - 開關：`docker start kotae-pg` / `docker stop kotae-pg`（重開機後要先開 Docker Desktop）。資料在 Volume 裡，`docker rm` 容器不會刪到資料。
  - 2026-10-18 以前用的是 SQL Server（容器 `kotae-sql`）：Azure 帳戶註冊被微軟拒絕，所以改用 PostgreSQL，資料已全部搬過來。
  - 連線字串在 `.env.local` 的 `DATABASE_URL`（`prisma.config.ts` 會讀它）。
  - migration 會刪掉有資料的欄位時，`migrate dev` 要互動確認，Claude Code 的終端機沒辦法回答 → 改用 `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` 產生 SQL 存成新的 migration 資料夾，再 `npx prisma migrate deploy`。
  - 改資料表：改 `prisma/schema.prisma` → `npx prisma migrate dev --name 說明`→ `npx prisma generate`（Prisma 7 的 migrate 不會自動 generate）→ **重開 `npm run dev`**（`app/lib/db.ts` 把 PrismaClient 存在 globalThis，不重開會用到舊的，出現 `Unknown field`）。
  - 看資料：`npx prisma studio`（網頁版資料表瀏覽器），或 `docker exec -it kotae-pg psql -U kotae -d kotae` 下 SQL。PostgreSQL 的資料表和欄位名稱有大小寫，SQL 裡要加雙引號，例如 `SELECT * FROM "Question" WHERE "questionId" = 1;`。

## 已確定的技術選擇

- Next.js（App Router）+ TypeScript，npm，**沒有 `src/` 資料夾**，import alias `@/*`。
- **不用 Tailwind**。樣式用一般 CSS / CSS Modules + CSS 變數。
- Prisma ORM，provider `postgresql`（`@prisma/adapter-pg`）。
- Claude API：出題、回饋、翻譯用 Sonnet；英文複習評分用 Haiku；開啟 prompt caching。金鑰放 `.env.local`，不可提交到 Git。
- **AI 產生的英文、日文以「口語、好念、好記」為主**：用常見單字、短句，聽起來像面試時自然說話，不用艱深或書面的字。日文仍用です・ます的禮貌體，但避免艱深的敬語句型。AI 回饋的思考程度（effort）維持 `medium`。
- **AI 修正、評分只看說出口的部分**：用字、文法、表達方式。大小寫、標點符號、空格不修正也不扣分（回答是要面試時說的，不是寫文章）。
- AI 呼叫：`app/lib/ai.ts`。`.env.local` 設 `KOTAE_AI_LIVE=1` 才真的呼叫 API，否則用示範內容。用量記錄在資料表 AiUsage（`app/lib/ai-usage.ts`），設定頁可看。
- 日文注音：kuroshiro 產生 `<ruby>`。朗讀：瀏覽器 Web Speech API。
- 登入：單一密碼，可記住裝置 30 天。
- 部署：GitHub + Vercel（資料庫 Neon），做成 PWA。

## 目前進度

- [x] 第 0 階段：Node v24、建立 Next.js 專案。
- [x] `app/globals.css`：兩種色調的 CSS 變數（`data-theme="ink"` 米白墨色 / `data-theme="blue"` 莫蘭迪藍），加上 del / ins / rt 樣式。
- [x] `app/layout.tsx`：`lang="zh-Hant"`、Source Serif 4（`--font-en`）、Noto Serif JP（`--font-ja`）。
- [x] 9 個畫面全部完成（2026-10-01，資料都是假資料，放在 `app/lib/*-data.ts`）：
  - 登入 `/login`、首頁 `/`、作答 `/practice`、AI 回饋 `/practice/feedback?q=`（含「再問 AI」底部視窗）、日文版 `/practice/japanese?q=`（注音開關、朗讀、修改讀音）
  - 複習 `/review?i=`（先英文重寫、再日文翻卡；排程規則在 `app/lib/review.ts`）
  - 練習紀錄 `/history`、設定 `/settings`
  - 共用元件在 `app/components/`：BottomNav、TopBar、BottomSheet、SpeakButton、CorrectionText、RubyText
- [x] 登入（2026-10-02）：`proxy.ts` 擋未登入；密碼 scrypt 雜湊、cookie HMAC 簽章（`app/lib/auth.ts`、`session.ts`）；`node scripts/set-password.mjs` 設定密碼並寫入 `.env.local`。
- [x] Claude API（2026-10-02，Sonnet 5.5，`app/lib/ai.ts`）：
  - AI 回饋＋評分（`app/lib/feedback-data.ts`、`app/practice/actions.ts`）
  - 日文翻譯＋平假名注音：由 Claude 翻譯時一起標讀音，**不用 kuroshiro**（`app/lib/japanese-data.ts`）
  - 再問 AI 追問（`app/lib/followup.ts`、`app/practice/feedback/actions.ts`）
  - 每次呼叫的用量寫入資料表 AiUsage（2026-10-08 從 `.kotae/ai-usage.jsonl` 搬過去），設定頁顯示今天 / 本月 / 累計
- 目前的暫時做法（之後要換掉）：
  - 追問的對話只存在視窗裡，關掉就清空。
- [x] 資料庫（2026-10-03）：Docker SQL Server + Prisma 7.10（`@prisma/adapter-mssql`），5 張表 Profile / Question / Answer / ReviewSchedule / ReviewLog。SQL Server 不支援 enum、Json，固定選項存字串、結構化內容存 JSON 字串（欄位名稱 `…Json`）。
- [x] 作答、AI 回饋、日文版改存 Answer 資料表（2026-10-03，`app/lib/answer-store.ts`、連線在 `app/lib/db.ts`）。
- [x] 設定改存 Profile（2026-10-03，`app/lib/profile-store.ts`、`app/settings/actions.ts`）：頁面從伺服器讀設定再用 props 傳給畫面；主題由 layout 從資料庫讀（登入頁用預設）。
- [x] 作答草稿改存 Answer.pendingDraft（2026-10-03）。
- [x] 讀音修正改存 Answer.readingFixesJson（2026-10-03）。專案已不再使用 localStorage。
- [x] 複習排程（2026-10-03，`app/lib/review-store.ts`）：送出作答排英文、AI 產生日文版排日文（都排明天）；複習頁每次顯示剩下的第一題；評分寫 ReviewLog 並更新 ReviewSchedule。「今天」一律用台灣時間（`app/lib/dates.ts`）。
- [x] 英文複習評分接 Claude Haiku 4.5（`app/lib/review-data.ts`）：拿 Answer.polished 當參考回答比對重點。Haiku 不支援 effort、fallbacks，`app/lib/ai.ts` 只對 Sonnet 送。
- [x] 每日出題（2026-10-08，`app/lib/question-store.ts`）：當天第一次打開作答頁時，Sonnet 依設定的題數和我的背景出題（附最近 60 題避免重複），當天改設定隔天才生效；做完可「再出一題」。作答頁在 `app/practice/(today)/`（route group，讓 loading.tsx 只套用到作答頁）。題目 id 是資料庫的數字，畫面上轉成字串。
- [x] 首頁和練習紀錄接資料庫（2026-10-08，`app/lib/home-data.ts`、`history-data.ts`）：「有練習的日子」＝那天出的題有送出作答或有做複習；連續天數今天還沒練從昨天算；熟練度＝複習間隔第幾階（1 天＝0 … 30 天＝4）。App 已經沒有假資料。
- [x] 各頁加 loading.tsx（共用 `app/components/PageSkeleton.tsx`）。
- [x] AI 用量改存資料表 AiUsage（2026-10-08，Vercel 不能長期保存檔案）。
- [x] 題目只出在日外商工程師題（2026-10-18）：track 只有 engineer / common，設定頁拿掉目標職缺和比例。
- [x] 資料庫改用 PostgreSQL（2026-10-18）：Azure 帳戶註冊被拒，改 PostgreSQL（本機 Docker、上線 Neon）。migration 重新產生一份 init，SQL Server 的資料用一次性腳本全部搬過來。
- 部署設定：`npm run build` 會先跑 `scripts/migrate-production.mjs`（只在 Vercel 正式環境執行 `prisma migrate deploy`）；`prisma.config.ts` 的 migrate 用 `DATABASE_URL_UNPOOLED`（Neon 直連），網站用 `DATABASE_URL`；`vercel.json` 把伺服器放在新加坡（`sin1`），要和 Neon 同地區。
- [x] 部署（2026-10-18）：Vercel 專案 `kotae`（https://kotae-tawny.vercel.app ，Production Branch 是 `main`，合併到 main 就自動部署）；資料庫 Neon（新加坡，環境變數前綴 `DATABASE`，所以是 `DATABASE_URL`、`DATABASE_URL_UNPOOLED`）。Vercel 上的環境變數：`ANTHROPIC_API_KEY`、`KOTAE_AI_LIVE`、`KOTAE_PASSWORD_HASH`、`KOTAE_SESSION_SECRET`。本機的練習資料已搬到 Neon；`.env.local` 的 `NEON_DATABASE_URL` 是正式資料庫的直連網址（從 Mac 操作線上資料用）。
- [x] PWA（2026-10-18）：`app/manifest.ts`、`app/layout.tsx` 的 appleWebApp / viewport，圖示在 `public/icons/`（`node scripts/make-icons.mjs` 產生，Logo 改了要重跑）。還沒有 service worker（離線、推播提醒之後再做）。
- [x] 中英切換（2026-10-25）：畫面文字都在 `app/i18n/zh.tsx`、`en.tsx`（兩邊 key 一樣，en 用 `Dict` 型別檢查）。伺服器元件和 Server Action 用 `getT()`（`app/i18n/server.ts`），瀏覽器元件用 `useT()`（`app/i18n/client.tsx`）。語言記在 cookie `kotae-lang`，設定頁切換；沒選過就看瀏覽器語言（中文→中文，其他→英文）。**還沒登入時（登入頁）固定英文**（2026-10-31，給履歷上的訪客看），登入後才套用上面的規則。題型在資料庫仍存中文（`經驗題` 等），畫面用 `t.types` 轉成目前語言。英文介面時，`app/lib/ai.ts` 會在指示最後加一段，請 Claude 把說明文字改用英文。AI 錯誤改成代碼（`app/lib/ai-errors.ts`），訊息在字典的 `aiErrors`。
- [x] 示範模式（2026-10-25，給履歷上的訪客）：登入頁「先逛逛」不用密碼。範例資料放在同一個資料庫的 `demo` schema（表格和正式資料一樣，`app/lib/demo-seed.ts` 建立，日期以今天為基準；超過 30 分鐘或不是今天的就整份重建）。查資料一律用 `getDb()`（`app/lib/db.ts`），示範模式自動換成 demo schema。示範模式不呼叫 Claude（`aiEnabled()`），原本問 AI 的地方改顯示 `app/lib/demo-content.ts` 的英文範例；介面固定英文；每頁上方有提示和「離開」。demo schema 的資料表：本機 `node scripts/migrate-demo.mjs`，上線時 `migrate-production.mjs` 會一起更新。
- [x] 「關於這個作品」頁和 README（2026-10-25，給履歷用）：`/about` 不用登入（`proxy.ts` 的公開頁面），內容固定英文，登入頁和設定頁有連結。README 改成英文介紹。截圖在 `public/screenshots/`（About 頁和 README 共用），用示範模式的資料拍。
- [ ] **之後可以做**：每日練習提醒（推播，需要 service worker）、追問對話存檔、練習次數算進重新作答。

## 設計規則

- 畫面設計稿在 `docs/design/`（`*.dc.html`，ink 和 `-blue` 兩套）。做畫面時照設計稿的版面、間距、文字。
- 設計稿是寫死顏色的，實作時**一律改用 CSS 變數**：
  `--bg --surface --ink --muted --border --input --neutral --en --en-soft --en-text --ja --ja-soft --ja-text --warn --warn-soft`
  另有：`--ink-soft`（說明文字）、`--logo`、`--switch-off`、深色卡片用的 `--hero-muted --hero-chip --hero-chip-text --hero-text --hero-line`。
- 字型 class：英文 `.en`，日文 `.ja`，中文是預設的 `--font-zh`。
- 手機優先，設計寬度 390px。底部導覽：今日 / 練習 / 複習 / 紀錄。
