import { requestNotificationAgreement } from "@apps-in-toss/web-framework";

import { NOTIFY_TEMPLATE_CODE } from "./env";
import { isInTossApp } from "./tossEnv";

const AGREED_KEY = "notify:agreed";

export function isNotifySupported(): boolean {
  try {
    return NOTIFY_TEMPLATE_CODE !== "" && isInTossApp();
  } catch {
    return false;
  }
}

/** 알림에 동의했는지 — 화면 표시용이에요. 실제 발송 대상은 토스가 관리해요. */
export function hasAgreedNotify(): boolean {
  return localStorage.getItem(AGREED_KEY) === "1";
}

/** 알림 동의 화면을 열고 결과를 돌려줘요. */
export function requestNotify(): Promise<string> {
  return new Promise((resolve, reject) => {
    let cleanup: unknown;
    // 반환값이 함수라는 보장이 없어요 — 토스 앱 버전에 따라 아무것도 안 돌려줍니다.
    const done = (fn: () => void) => {
      fn();
      if (typeof cleanup === "function") cleanup();
    };
    try {
      cleanup = requestNotificationAgreement({
        options: { templateCode: NOTIFY_TEMPLATE_CODE },
        onEvent: (result) => {
          if (result.type !== "agreementRejected") {
            localStorage.setItem(AGREED_KEY, "1");
          }
          done(() => resolve(result.type));
        },
        onError: (error) => done(() => reject(error)),
      });
    } catch (error) {
      reject(error);
    }
  });
}
