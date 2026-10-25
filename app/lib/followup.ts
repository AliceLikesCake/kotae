import "server-only";
import { aiEnabled, askChat, MODELS } from "./ai";
import { DEMO_FOLLOWUP_EN } from "./demo-content";
import { isDemo } from "./demo-session";
import type { Feedback } from "./feedback-data";
import type { Question } from "./practice-data";
import { getSavedAnswer } from "./answer-store";

// 「再問 AI」：針對某一題的回饋繼續追問。AI 會看到題目、學生的回答和完整回饋。

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM = `你是英文面試教練，學生是台灣人，正在準備日本的外商公司工程師職缺面試。
學生剛收到你對某一題回答的回饋，現在想針對這份回饋繼續發問。題目、學生的回答和回饋內容附在後面。

回答原則：
- 用繁體中文回答，英文字詞和例句保留英文。
- 簡潔、直接回答問題，大約 3 到 8 句；需要列點時用「1.」「2.」或「・」。
- 不要使用 Markdown 符號（例如 **、#、表格），畫面會直接顯示文字。
- 提供英文例句時，以「口語、好念、好記」為主：常見單字、短句，像面試時自然說話。
- 不可以編造學生沒提過的經歷、數字或公司名稱；需要學生補充的資訊，請用提問的方式請他提供。
- 問題和面試練習無關時，簡短回答後，把話題帶回這一題的練習。`;

/** 把文法修正套用後的全文（給 AI 參考） */
function correctedText(feedback: Feedback) {
  return feedback.corrected.map((p) => (typeof p === "string" ? p : (p.ins ?? ""))).join("");
}

function buildContext(question: Question, answer: string, feedback: Feedback) {
  const { score, interviewer } = feedback;
  return [
    `【面試題目】\n${question.en}`,
    `【應徵的職缺】\n${interviewer.audience}`,
    `【學生的回答】\n${answer}`,
    `【評分】總分 ${score.total}／100，內容 ${score.content}／4、文法 ${score.grammar}／4、結構 ${score.structure}／4。${score.summary}`,
    `【文法修正後】\n${correctedText(feedback)}`,
    `【修改說明】\n${feedback.notes.map((n, i) => `${i + 1}. ${n}`).join("\n") || "（無）"}`,
    `【這題在考】\n${interviewer.focus}`,
    `【已講到 / 可加強】\n${interviewer.points.map((p) => `${p.status === "covered" ? "已講到" : "可加強"}：${p.text}`).join("\n")}`,
    `【面試優化版】\n${feedback.polished}`,
  ].join("\n\n");
}

const DEMO_REPLY =
  "（示範回覆）這是固定的示範內容。開啟 KOTAE_AI_LIVE=1 並送出這題的作答後，AI 會根據你的回答和回饋來回覆。";

/** 回傳 AI 對最後一則提問的回答；沒開 KOTAE_AI_LIVE 或這題還沒有 AI 回饋時回傳示範回覆 */
export async function askFollowUp(question: Question, messages: ChatMessage[]): Promise<string> {
  const saved = await getSavedAnswer(question);
  if (await isDemo()) return DEMO_FOLLOWUP_EN;
  if (!(await aiEnabled()) || !saved || saved.feedback.source !== "ai") return DEMO_REPLY;

  const reply = await askChat({
    label: `追問 ${question.id}`,
    model: MODELS.main,
    system: SYSTEM,
    context: buildContext(question, saved.answer, saved.feedback),
    messages,
    effort: "medium",
  });
  return reply.trim();
}
