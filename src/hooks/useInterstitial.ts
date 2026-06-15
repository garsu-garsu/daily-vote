import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { useCallback, useEffect, useRef } from "react";

import { AD_GROUP_ID_INTERSTITIAL } from "../lib/env";

// 전면 광고는 세션당 1회만 노출해요(광고 피로 방지). 보상형 게이트와 겹치지 않게,
// 결과를 광고 없이 보는 화면(지난 결과)에서만 호출해요.
let shownThisSession = false;

/** 전면(interstitial) 광고. 미지원/미설정/미로드면 조용히 건너뛰어요. */
export function useInterstitial(): () => void {
  const supportedRef = useRef(false);
  const readyRef = useRef(false);
  const unloadRef = useRef<(() => void) | null>(null);

  const load = useCallback(() => {
    if (AD_GROUP_ID_INTERSTITIAL === "") return;
    try {
      if (!loadFullScreenAd.isSupported()) return;
      supportedRef.current = true;
      unloadRef.current = loadFullScreenAd({
        options: { adGroupId: AD_GROUP_ID_INTERSTITIAL },
        onEvent: (e) => {
          if (e.type === "loaded") readyRef.current = true;
        },
        onError: (err) => console.error("전면 광고 로드 실패:", err),
      });
    } catch (err) {
      console.error("전면 광고 환경 확인 실패:", err);
    }
  }, []);

  useEffect(() => {
    load();
    return () => unloadRef.current?.();
  }, [load]);

  return useCallback(() => {
    if (shownThisSession) return;
    if (
      AD_GROUP_ID_INTERSTITIAL === "" ||
      !supportedRef.current ||
      !readyRef.current
    ) {
      return;
    }
    shownThisSession = true;
    try {
      showFullScreenAd({
        options: { adGroupId: AD_GROUP_ID_INTERSTITIAL },
        onEvent: (e) => {
          if (e.type === "dismissed" || e.type === "failedToShow") {
            readyRef.current = false;
          }
        },
        onError: (err) => console.error("전면 광고 표시 실패:", err),
      });
    } catch (err) {
      console.error("전면 광고 표시 실패:", err);
    }
  }, []);
}
