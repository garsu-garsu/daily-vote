import { getTossShareLink, share } from "@apps-in-toss/web-framework";

import { isInTossApp } from "../lib/tossEnv";

// granite.config.ts 의 appName·icon 과 맞춰야 해요. ("intoss://" 로 시작하지 않으면 링크가 안 만들어져요)
const DEEP_LINK = "intoss://daily-vote";
const OG_IMAGE =
  "https://static.toss.im/appsintoss/13203/20210dfe-27e2-4af5-912b-49087a57c4be.png";

/**
 * 결과 카드를 공유해요. (토스 공유 링크 + 메시지)
 * 공유 시트가 정상적으로 뜨고 끝나면 true. 브라우저(개발)에서는 통과(true).
 * 한계: "실제로 친구에게 보냈는지"는 검증할 수 없어 공유 시트 완료를 성공으로 봐요.
 */
export async function shareResult(message: string): Promise<boolean> {
  if (!isInTossApp()) return true; // 브라우저 개발 환경
  try {
    let link = "";
    try {
      link = await getTossShareLink(DEEP_LINK, OG_IMAGE);
    } catch (e) {
      // 링크 생성 실패해도 텍스트만으로 공유는 계속 진행해요. (조용히 넘기면 이번처럼 못 찾아요)
      console.error("공유 링크 생성 실패:", e);
    }
    const full = link !== "" ? `${message}\n${link}` : message;
    await share({ message: full });
    return true;
  } catch {
    return false;
  }
}
