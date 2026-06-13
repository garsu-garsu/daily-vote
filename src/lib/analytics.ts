// 분석 이벤트 로깅 — 앱인토스 콘솔 "분석" 대시보드로 흘러가요.
// 브라우저(개발)·미지원 환경에서는 조용히 무시해요.
import { eventLog } from "@apps-in-toss/web-framework";

type Primitive = string | number | boolean;
type Params = Record<string, Primitive | null | undefined>;
type LogType = "event" | "screen" | "click" | "impression";

function clean(params: Params): Record<string, Primitive> {
  const out: Record<string, Primitive> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v != null) out[k] = v;
  }
  return out;
}

export function track(name: string, params: Params = {}, type: LogType = "event"): void {
  try {
    void eventLog({ log_name: name, log_type: type, params: clean(params) }).catch(
      () => {},
    );
  } catch {
    /* 미지원 환경 무시 */
  }
}

export function trackScreen(name: string, params: Params = {}): void {
  track(`screen_${name}`, params, "screen");
}

// 퍼널 이벤트 (전환 지표 설정 시 이 이름으로 단계 정의)
export const EVENT = {
  signup: "signup_complete", // { method: 'toss' | 'guest' }
  voteCast: "vote_cast", // { question_id, choice }
  resultViewed: "result_viewed", // { question_id, gate: 'ad' | 'share' | 'natural' }
  adRewarded: "ad_rewarded", // { context }
  shareCompleted: "share_completed", // { context }
  loginUpsellClick: "login_upsell_click",
} as const;
