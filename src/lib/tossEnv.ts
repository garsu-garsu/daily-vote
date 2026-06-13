/**
 * 토스 앱(WebView) 안에서 실행 중인지 여부.
 * 토스 미니앱은 RN WebView 안에서 열리며 `window.ReactNativeWebView`가 주입돼요.
 * 일반 브라우저(개발)에는 없으므로 이걸로 환경을 구분해요.
 */
export function isInTossApp(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView !=
      null
  );
}
