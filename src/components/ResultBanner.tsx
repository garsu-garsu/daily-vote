import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

import { AD_GROUP_ID_BANNER } from "../lib/env";

// 결과 화면 하단 배너 (WebView). 미지원(브라우저/구버전)·미설정이면 아무것도 렌더링하지 않아요.
// 참고문서: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
export function ResultBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // SDK 초기화
  useEffect(() => {
    if (AD_GROUP_ID_BANNER === "") return;
    try {
      if (!TossAds.initialize.isSupported()) return;
      TossAds.initialize({
        callbacks: {
          onInitialized: () => setReady(true),
          onInitializationFailed: (e) =>
            console.error("배너 초기화 실패:", e),
        },
      });
    } catch (e) {
      console.error("배너 초기화 실패:", e);
    }
  }, []);

  // 배너 부착
  useEffect(() => {
    if (!ready || ref.current == null || AD_GROUP_ID_BANNER === "") return;
    let attached: { destroy: () => void } | undefined;
    try {
      attached = TossAds.attachBanner(AD_GROUP_ID_BANNER, ref.current, {
        theme: "auto",
        tone: "grey",
        variant: "card",
      });
    } catch (e) {
      console.error("배너 표시 실패:", e);
    }
    return () => {
      try {
        attached?.destroy();
      } catch (e) {
        console.error("배너 정리 실패:", e);
      }
    };
  }, [ready]);

  if (AD_GROUP_ID_BANNER === "") return null;
  return <div ref={ref} style={{ width: "100%", minHeight: 96 }} />;
}
