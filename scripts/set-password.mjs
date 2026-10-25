// 設定（或更改）登入密碼：node scripts/set-password.mjs
// 會在 .env.local 寫入 KOTAE_PASSWORD_HASH（密碼雜湊）和 KOTAE_SESSION_SECRET（登入 cookie 的簽章密鑰）。
// 每次執行都會換新的密鑰，所以改密碼後，所有已登入的裝置都要重新登入。
// 只用 Node.js 內建功能，不需要安裝套件。

import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ENV_FILE = fileURLToPath(new URL("../.env.local", import.meta.url));
const MIN_LENGTH = 8;

/** 讀取輸入但不顯示內容（顯示成 *） */
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (ch === "\u0003") {
          // Ctrl+C
          process.stdout.write("\n已取消\n");
          process.exit(1);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (value) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        value += ch;
        process.stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

/** 更新 .env.local 裡的指定設定，其他行保持不變 */
function upsertEnv(values) {
  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8").split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const index = lines.findIndex((l) => l.startsWith(`${key}=`));
    if (index >= 0) lines[index] = line;
    else lines.splice(lines.at(-1) === "" ? lines.length - 1 : lines.length, 0, line);
  }
  writeFileSync(ENV_FILE, lines.join("\n").replace(/\n*$/, "\n"));
}

const password = await askHidden(`請輸入新密碼（至少 ${MIN_LENGTH} 個字）：`);
if (password.length < MIN_LENGTH) {
  console.error(`密碼太短，至少要 ${MIN_LENGTH} 個字。沒有做任何變更。`);
  process.exit(1);
}
const confirm = await askHidden("請再輸入一次：");
if (password !== confirm) {
  console.error("兩次輸入的密碼不一樣。沒有做任何變更。");
  process.exit(1);
}

// 格式 scrypt:<salt>:<hash>，用 base64url 編碼。不用 $ 分隔，因為 .env 檔會把 $ 當成變數展開
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
upsertEnv({
  KOTAE_PASSWORD_HASH: `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`,
  KOTAE_SESSION_SECRET: randomBytes(32).toString("base64url"),
});

console.log("已更新 .env.local 的 KOTAE_PASSWORD_HASH 和 KOTAE_SESSION_SECRET。");
console.log("如果開發伺服器正在執行，請重新啟動（Ctrl+C 後再 npm run dev）。");
