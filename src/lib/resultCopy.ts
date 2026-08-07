// 결과 문구를 만드는 순수 함수들. UI가 섞여 있지 않아 node로 바로 검증할 수 있어요.
// 검증: node scripts/check-share-message.mjs
import type { Choice, Question, VoteResult } from "../types";

/** 표가 이만큼은 모여야 "다수/소수" 판정과 비율을 보여줘요. (1~2명일 때 100% 문구 방지) */
export const MIN_SAMPLE = 5;

/** 투표 직후 공유 카드 문구. 앱 이름과 오늘 질문이 들어가야 유입으로 이어져요. */
export function buildShareMessage(
  question: Question,
  myChoice: Choice,
  result: VoteResult | null,
): string {
  const pick = myChoice === "A" ? question.optionA : question.optionB;
  // 표가 적으면 비율은 빼고 질문·내 선택만 공유해요.
  const r = result != null && result.total >= MIN_SAMPLE ? result : null;
  const split =
    r != null
      ? `\n지금 ${question.optionA} ${r.percentA}% vs ${question.optionB} ${r.percentB}%`
      : "";
  const mine = r != null ? (myChoice === "A" ? r.percentA : r.percentB) : null;
  const mineLine =
    mine != null && mine < 50 ? `난 ${pick} — ${mine}% 소수파예요 😎` : `난 ${pick}!`;
  return `[오늘의 다수결] 오늘의 밸런스 게임\n"${question.title}"${split}\n${mineLine} 너는 어느 쪽?`;
}
