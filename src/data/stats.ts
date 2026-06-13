import { addDays, kstTodayString } from "../lib/kst";
import { fetchResult } from "./results";
import { fetchMyVoteHistory } from "./votes";

export interface MyStats {
  totalVotes: number;
  streak: number;
  majorityCount: number;
  minorityCount: number;
  /** 결과가 공개된 투표 기준 다수파 적중률(%) */
  majorityRate: number;
}

/** 내 투표 기록으로 총 투표 수·스트릭·다수파 적중률을 계산해요. */
export async function fetchMyStats(): Promise<MyStats> {
  const history = await fetchMyVoteHistory();
  const today = kstTodayString();

  // 스트릭: 오늘부터 거꾸로 연속 투표일 수
  const votedDates = new Set(history.map((h) => h.publishDate).filter(Boolean));
  let streak = 0;
  let cursor = today;
  if (!votedDates.has(cursor)) cursor = addDays(cursor, -1); // 오늘 안 했어도 어제까지는 인정
  while (votedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  // 다수파/소수파: 결과가 공개된(어제 이전) 투표만 대상
  const publicVotes = history.filter((h) => h.publishDate && h.publishDate < today);
  const results = await Promise.all(
    publicVotes.map((v) => fetchResult(v.questionId).catch(() => null)),
  );
  let majorityCount = 0;
  let minorityCount = 0;
  let resolved = 0;
  publicVotes.forEach((v, i) => {
    const r = results[i];
    if (r == null || r.total === 0) return;
    resolved += 1;
    const mine = v.choice === "A" ? r.percentA : r.percentB;
    if (mine >= 50) majorityCount += 1;
    else minorityCount += 1;
  });

  return {
    totalVotes: history.length,
    streak,
    majorityCount,
    minorityCount,
    majorityRate: resolved === 0 ? 0 : Math.round((majorityCount / resolved) * 100),
  };
}
