import { supabase } from "../lib/supabase";
import type { Question } from "../types";
import { toQuestion } from "./mappers";

/** 오늘 질문 (가장 최근 공개일). */
export async function fetchTodayQuestion(): Promise<Question | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toQuestion(data) : null;
}

/** 공개된 질문 전체 (오늘 포함, 최신순). */
export async function fetchPublishedQuestions(): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("publish_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toQuestion);
}
