import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

import { AD_GROUP_ID_BANNER } from "../lib/env";

// 결과 화면 하단 배너 (WebView). 미지원(브라우저/구버전)·미설정이면 아무것도 렌더링하지 않아요.
// 참고문서: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
/**
 * 30초인 이유: 토스 배너는 AdMob 기반인데 AdMob 은 30초보다 잦은 갱신을
 * 무효 트래픽으로 봐요. 더 짧게 잡으면 수익보다 제재 위험이 커져요.
 */
const REFRESH_MS = 30_000;

export function ResultBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // 이 값이 바뀔 때마다 아래 effect 가 다시 돌면서 배너를 새로 붙여요.
  const [round, setRound] = useState(0);

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
  }, [ready, round]);

  // 화면을 보고 있을 때만 갱신해요. 안 보이는 동안 돌리면 노출로 잡히지 않고
  // 호출만 쌓여요.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => {
      if (timer != null) clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = setInterval(() => setRound((n) => n + 1), REFRESH_MS);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (AD_GROUP_ID_BANNER === "") return null;
  return <div ref={ref} style={{ width: "100%", minHeight: 96 }} />;
}
