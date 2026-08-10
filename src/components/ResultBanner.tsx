import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

import { AD_GROUP_ID_BANNER, AD_GROUP_ID_BANNER_IMAGE } from "../lib/env";
import { EVENT, track } from "../lib/analytics";

// 결과 화면 하단 배너 (WebView). 미지원(브라우저/구버전)·미설정이면 아무것도 렌더링하지 않아요.
// 참고문서: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md
/**
 * 30초인 이유: 토스 배너는 AdMob 기반인데 AdMob 은 30초보다 잦은 갱신을
 * 무효 트래픽으로 봐요. 더 짧게 잡으면 수익보다 제재 위험이 커져요.
 */
const REFRESH_MS = 30_000;

export function ResultBanner({
  adGroupId = AD_GROUP_ID_BANNER,
  minHeight = 96,
}: {
  /** 비우면 기존 문구형 지면을 써요. */
  adGroupId?: string;
  /** 자리 높이(px). 높이 0 이면 광고가 렌더링되지 않아요. */
  minHeight?: number;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // 이 값이 바뀔 때마다 아래 effect 가 다시 돌면서 배너를 새로 붙여요.
  const [round, setRound] = useState(0);

  // SDK 초기화
  useEffect(() => {
    if (adGroupId === "") return;
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
    if (!ready || ref.current == null || adGroupId === "") return;
    let attached: { destroy: () => void } | undefined;
    try {
      attached = TossAds.attachBanner(adGroupId, ref.current, {
        theme: "auto",
        tone: "grey",
        variant: "card",
        callbacks: {
          onAdRendered: () => track(EVENT.adBannerImpression, {}, "impression"),
        },
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

  if (adGroupId === "") return null;
  return <div ref={ref} style={{ width: "100%", minHeight }} />;
}

/**
 * 이미지 강조형 배너 — 본문 스크롤의 맨 아래에 붙여요.
 * 위쪽 문구형 배너와 달리 끝까지 내려야 보여요.
 */
export function ImageResultBanner() {
  return <ResultBanner adGroupId={AD_GROUP_ID_BANNER_IMAGE} minHeight={200} />;
}
