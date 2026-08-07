// 공유 문구 만들기 최소 검증: node scripts/check-share-message.mjs
// (Node 22.18+ 의 TypeScript 타입 스트리핑으로 .ts 를 그대로 불러와요)
import assert from "node:assert/strict";
import { buildShareMessage, MIN_SAMPLE } from "../src/lib/resultCopy.ts";

const question = {
  id: "q1",
  category: "음식",
  title: "탕수육, 부먹 vs 찍먹?",
  optionA: "부먹",
  optionB: "찍먹",
  emojiA: "🥣",
  emojiB: "🥢",
  publishDate: "2026-08-07",
};

const result = (total, percentA) => ({
  questionId: "q1",
  total,
  countA: 0,
  countB: 0,
  percentA,
  percentB: 100 - percentA,
  byAge: [],
  byGender: [],
});

// 1) 앱 이름과 오늘 질문은 항상 들어가야 유입으로 이어져요.
for (const r of [null, result(0, 0), result(100, 70)]) {
  const msg = buildShareMessage(question, "A", r);
  assert.ok(msg.includes("[오늘의 다수결]"), "앱 이름 누락");
  assert.ok(msg.includes(question.title), "질문 누락");
  assert.ok(msg.includes("너는 어느 쪽?"), "물어보는 마무리 누락");
}

// 2) 표가 충분하면 비율을 넣고, 소수파면 소수파 문구로.
const many = buildShareMessage(question, "B", result(100, 70));
assert.ok(many.includes("부먹 70% vs 찍먹 30%"), many);
assert.ok(many.includes("30% 소수파"), many);

// 3) 다수파는 소수파 문구 없이.
const majority = buildShareMessage(question, "A", result(100, 70));
assert.ok(!majority.includes("소수파"), majority);
assert.ok(majority.includes("난 부먹!"), majority);

// 4) 표가 적으면(MIN_SAMPLE 미만) 비율은 빼요 — "100% 소수파" 같은 문구 방지.
const few = buildShareMessage(question, "A", result(MIN_SAMPLE - 1, 100));
assert.ok(!few.includes("%"), few);
assert.ok(!few.includes("소수파"), few);

console.log("share message OK");
