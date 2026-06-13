import { supabase } from "../lib/supabase";
import type { Choice } from "../types";

/** 내 투표 기록 (questionId → choice). */
export async function fetchMyVotes(): Promise<Record<string, Choice>> {
  const { data, error } = await supabase.from("votes").select("question_id, choice");
  if (error) throw error;
  const map: Record<string, Choice> = {};
  for (const row of data ?? []) map[row.question_id] = row.choice as Choice;
  return map;
}

/** 투표 제출. user_id는 RLS에서 auth.uid()로 강제돼요. */
export async function submitVote(questionId: string, choice: Choice): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (uid == null) throw new Error("로그인이 필요해요.");

  const { error } = await supabase
    .from("votes")
    .insert({ user_id: uid, question_id: questionId, choice });
  if (error) throw error;
}

/** 내 투표 + 질문 공개일 (스트릭/통계 계산용). */
export async function fetchMyVoteHistory(): Promise<
  { questionId: string; choice: Choice; publishDate: string }[]
> {
  const { data, error } = await supabase
    .from("votes")
    .select("question_id, choice, questions(publish_date)");
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    questionId: r.question_id as string,
    choice: r.choice as Choice,
    publishDate:
      ((r.questions as { publish_date?: string } | null)?.publish_date as string) ?? "",
  }));
}
