// 產生 PWA 和主畫面用的圖示（public/icons/*.png、app/icon.svg）。Logo 改了再執行一次：node scripts/make-icons.mjs
// 用 Next.js 內建的 @vercel/og（satori + resvg）把 SVG 轉成 PNG，不需要另外安裝套件。

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { ImageResponse } = require("next/dist/compiled/@vercel/og/index.node.js");

// 和 app/components/Logo.tsx 同一個圖形，顏色用米白墨色主題（--logo、--ja）
const INK = "#1F2328";
const RED = "#B8432B";
const MARK = `
  <path d="M27 30h44a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H47l-12 10V70h-8a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linejoin="round"/>
  <circle cx="40" cy="46" r="3.4" fill="#FFFFFF"/>
  <circle cx="58" cy="46" r="3.4" fill="#FFFFFF"/>
  <path d="M38.5 55c3 3.6 6.4 5.4 10.5 5.4s7.5-1.8 10.5-5.4" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
  <circle cx="79" cy="24" r="11" fill="${RED}" stroke="${INK}" stroke-width="3"/>
  <path d="M74.5 24l3 3 6-6" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;

/** rounded：圓角底（一般圖示）；否則方形滿版底。scale：圖案縮放（maskable 要留安全範圍） */
function svg({ rounded, scale = 1 }) {
  const offset = (100 - 100 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" ${rounded ? 'rx="23"' : ""} fill="${INK}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${MARK}</g>
</svg>`;
}

async function png(file, size, options) {
  const src = `data:image/svg+xml;base64,${Buffer.from(svg(options)).toString("base64")}`;
  const image = new ImageResponse({ type: "img", props: { src, width: size, height: size } }, { width: size, height: size });
  writeFileSync(file, Buffer.from(await image.arrayBuffer()));
  console.log("產生", file);
}

await png("public/icons/apple-touch-icon.png", 180, { rounded: false, scale: 0.92 });
await png("public/icons/icon-192.png", 192, { rounded: true });
await png("public/icons/icon-512.png", 512, { rounded: true });
await png("public/icons/icon-maskable-512.png", 512, { rounded: false, scale: 0.78 });
writeFileSync("app/icon.svg", svg({ rounded: true }) + "\n");
console.log("產生 app/icon.svg");
