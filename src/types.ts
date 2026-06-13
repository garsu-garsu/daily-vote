// 오늘의 다수결 — 공통 도메인 타입

export type Gender = "male" | "female";
export type AgeBand = "10s" | "20s" | "30s" | "40s" | "50s" | "60plus";
export type Choice = "A" | "B";

export interface Profile {
  id: string; // supabase auth uid
  tossUserKey: string | null;
  gender: Gender | null;
  ageBand: AgeBand | null;
  createdAt: string;
}

export interface Question {
  id: string;
  category: string;
  title: string;
  optionA: string;
  optionB: string;
  emojiA: string;
  emojiB: string;
  publishDate: string; // YYYY-MM-DD
}

export interface SegmentResult {
  label: string;
  percentA: number;
}

export interface VoteResult {
  questionId: string;
  total: number;
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  byAge: SegmentResult[];
  byGender: SegmentResult[];
}
