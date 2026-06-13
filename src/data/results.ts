import { supabase } from "../lib/supabase";
import type { VoteResult } from "../types";
import { toResult } from "./mappers";

/** 공개된 질문 결과 (익일 공개분). RLS가 미공개 질문은 막아요. */
export async function fetchResult(questionId: string): Promise<VoteResult | null> {
  const { data, error } = await supabase
    .from("vote_results")
    .select("*")
    .eq("question_id", questionId)
    .maybeSingle();
  if (error) throw error;
  return data ? toResult(data) : null;
}

/** "지금 결과 보기" — 광고/공유 게이트 통과 시. 오늘 질문도 즉시 집계해 반환. */
export async function fetchResultNow(questionId: string): Promise<VoteResult | null> {
  const { data, error } = await supabase.rpc("get_result_now", {
    p_question_id: questionId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? toResult(row) : null;
}
