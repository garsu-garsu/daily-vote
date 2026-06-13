import { getTossShareLink, share } from "@apps-in-toss/web-framework";

import { isInTossApp } from "../lib/tossEnv";

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
      link = await getTossShareLink("/");
    } catch {
      // 링크 생성 실패해도 텍스트만으로 공유는 계속 진행해요.
    }
    const full = link !== "" ? `${message}\n${link}` : message;
    await share({ message: full });
    return true;
  } catch {
    return false;
  }
}
