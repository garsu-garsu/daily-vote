// KST(한국 표준시, UTC+9) 기준 날짜 유틸.
// 투표 마감/결과 공개는 모두 KST 자정 기준이에요.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 오늘 날짜를 KST 기준 "YYYY-MM-DD" 문자열로 돌려줘요. */
export function kstTodayString(): string {
  return toKstDateString(new Date());
}

function toKstDateString(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD"에서 n일 더한(또는 뺀) 날짜 문자열을 돌려줘요. */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return toKstDateString(new Date(base + n * 24 * 60 * 60 * 1000 - KST_OFFSET_MS));
}

/** "2026-06-12" → "6월 12일" */
export function formatKorean(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}

/** "2026-06-12" → "6월 12일 (금)" */
export function formatKoreanWithDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const day = days[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 (${day})`;
}

/** dateStr이 오늘(KST)보다 과거이면 true. */
export function isPast(dateStr: string): boolean {
  return dateStr < kstTodayString();
}

/** 자정까지 남은 시간을 "N시간 M분" 형태로 돌려줘요. */
export function timeUntilMidnight(): string {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const ms =
    24 * 60 * 60 * 1000 -
    ((kstNow.getUTCHours() * 60 + kstNow.getUTCMinutes()) * 60 +
      kstNow.getUTCSeconds()) *
      1000;
  const totalMin = Math.ceil(ms / (60 * 1000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}
