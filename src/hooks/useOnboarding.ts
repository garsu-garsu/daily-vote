import { useCallback, useState } from "react";

const KEY = "daily-vote:onboarded";

/** 온보딩을 마쳤는지. 저장 자체가 막힌 환경(프라이빗 모드 등)에서는 매번 뜨는 걸 막기 위해
 * 읽기 실패를 "이미 봤음"으로 처리해요. */
function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return true;
  }
}

function markOnboarded(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* noop */
  }
}

/** 첫 실행에만 도는 코치마크. 화면을 누르면 다음 단계로 넘어가고, 건너뛰기로 바로 끝나요. */
export function useOnboarding(total: number) {
  const [index, setIndex] = useState(() => (isOnboarded() ? -1 : 0));

  const next = useCallback(() => {
    setIndex((prev) => {
      if (prev < 0) return prev;
      const nextIndex = prev + 1;
      if (nextIndex >= total) {
        markOnboarded();
        return -1;
      }
      return nextIndex;
    });
  }, [total]);

  const skip = useCallback(() => {
    markOnboarded();
    setIndex(-1);
  }, []);

  return { index, next, skip };
}
