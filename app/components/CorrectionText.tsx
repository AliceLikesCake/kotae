import type { CorrectionPart } from "../lib/feedback-data";

// 文法修正：刪掉的字用 <del>、改成的字用 <ins>（樣式在 globals.css）
export default function CorrectionText({ parts }: { parts: CorrectionPart[] }) {
  return parts.map((part, i) =>
    typeof part === "string" ? (
      part
    ) : (
      <span key={i}>
        {part.del && <del>{part.del}</del>}
        {part.del && part.ins && " "}
        {part.ins && <ins>{part.ins}</ins>}
      </span>
    ),
  );
}
