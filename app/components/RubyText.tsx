import type { RubyPart } from "../lib/ruby";

// 日文加注音：漢字用 <ruby>，讀音放 <rt>
export default function RubyText({ parts }: { parts: RubyPart[] }) {
  return parts.map((p, i) =>
    typeof p === "string" ? (
      p
    ) : (
      <ruby key={i}>
        {p.base}
        <rt>{p.reading}</rt>
      </ruby>
    ),
  );
}
