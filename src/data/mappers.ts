// DB row(snake_case) → 도메인 객체(camelCase)
import type { Profile, Question, VoteResult } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function toProfile(r: any): Profile {
  return {
    id: r.id,
    tossUserKey: r.toss_user_key ?? null,
    gender: r.gender ?? null,
    ageBand: r.age_band ?? null,
    createdAt: r.created_at,
  };
}

export function toQuestion(r: any): Question {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    optionA: r.option_a,
    optionB: r.option_b,
    emojiA: r.emoji_a ?? "",
    emojiB: r.emoji_b ?? "",
    publishDate: r.publish_date,
  };
}

export function toResult(r: any): VoteResult {
  const total = (r.total as number) ?? 0;
  const countA = (r.count_a as number) ?? 0;
  const countB = (r.count_b as number) ?? 0;
  const percentA = total === 0 ? 0 : Math.round((countA / total) * 100);
  const seg = (arr: any): { label: string; percentA: number }[] =>
    Array.isArray(arr)
      ? arr.map((x: any) => ({ label: x.label, percentA: x.percent_a ?? 0 }))
      : [];
  return {
    questionId: r.question_id,
    total,
    countA,
    countB,
    percentA,
    percentB: total === 0 ? 0 : 100 - percentA,
    byAge: seg(r.by_age),
    byGender: seg(r.by_gender),
  };
}
