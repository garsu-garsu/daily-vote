// 환경 변수 접근 (Vite). 값은 .env 또는 배포 환경에서 주입돼요.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/** 보상형 광고 그룹 ID. 비어있으면 보상 콜백을 즉시 실행해 개발/브라우저에서도 흐름이 안 끊겨요. */
export const AD_GROUP_ID_REWARDED =
  import.meta.env.VITE_AD_GROUP_ID_REWARDED ?? "";

/** 전면형 광고 그룹 ID. 비어있으면 건너뛰어요. */
export const AD_GROUP_ID_INTERSTITIAL =
  import.meta.env.VITE_AD_GROUP_ID_INTERSTITIAL ?? "";

/** 배너 광고 그룹 ID. 비어있으면 배너를 렌더링하지 않아요. */
export const AD_GROUP_ID_BANNER = import.meta.env.VITE_AD_GROUP_ID_BANNER ?? "";

/** 알림 수신 동의 템플릿 코드. 비어있으면 동의 요청을 건너뛰어요. */
export const NOTIFY_TEMPLATE_CODE =
  import.meta.env.VITE_NOTIFY_TEMPLATE_CODE ?? "";

export const HAS_SUPABASE = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
