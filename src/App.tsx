import { Tab, Top } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { CoachMark } from "./components/CoachMark";
import { useOnboarding } from "./hooks/useOnboarding";
import { useSession } from "./hooks/useSession";
import { trackScreen } from "./lib/analytics";
import { TodayPage } from "./pages/TodayPage";
import { ArchivePage } from "./pages/ArchivePage";
import { ReportPage } from "./pages/ReportPage";

const TABS = ["오늘 투표", "지난 결과", "내 성향"] as const;
const TAB_SCREENS = ["today", "archive", "report"] as const;

function App() {
  const [tab, setTab] = useState(0); // 0 = 오늘 투표
  // 세션 준비를 기다리지 않아요 — 오늘 질문은 로그인 없이도 바로 보여요.
  const { profile, error, login } = useSession();

  const voteRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  // 첫 화면에서 실제로 짚어줄 요소 2개 — 예전 소개 화면이 설명하던 내용을 그 자리에서 짚어줘요.
  const tourSteps = [
    { ref: voteRef, message: "오늘의 질문에 3초 투표해요. 둘 중 하나만 골라 보세요" },
    { ref: tabRef, message: "지난 투표는 '지난 결과'에서, 내 성향은 '내 리포트'에서 볼 수 있어요" },
  ];
  const tour = useOnboarding(tourSteps.length);

  useEffect(() => {
    trackScreen(TAB_SCREENS[tab]);
  }, [tab]);

  // 창 전체 클릭으로 다음 단계 — 건너뛰기 버튼 클릭은 여기서 가로채지 않고 그대로 통과시켜요.
  useEffect(() => {
    if (tour.index < 0) return;
    const onClick = (event: MouseEvent) => {
      if ((event.target as HTMLElement | null)?.closest("[data-tour-skip]") != null) return;
      event.preventDefault();
      event.stopPropagation();
      tour.next();
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [tour]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.white }}>
        {/* 앱 이름은 토스 상단 바가 이미 보여줘요. 여기서 또 쓰면 헤더가 겹쳐 보여
        "자체 헤더 중복"으로 심사 반려돼요. 대신 무엇을 얻는지를 적어요. */}
      <Top
        title={<Top.TitleParagraph size={22}>오늘의 질문</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            매일 새 밸런스 게임에 3초 투표하고 전국 찬반 결과를 봐요
          </Top.SubtitleParagraph>
        }
      />

      <div ref={tabRef} style={{ padding: "0 12px" }}>
        <Tab onChange={(i) => setTab(i)} ariaLabel="화면 선택">
          {TABS.map((label, i) => (
            <Tab.Item key={label} selected={tab === i}>
              {label}
            </Tab.Item>
          ))}
        </Tab>
      </div>

      <div style={{ paddingTop: 12 }}>
        {error ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: colors.grey500 }}>
            연결에 문제가 생겼어요.
            <br />
            잠시 후 다시 시도해 주세요.
          </div>
        ) : (
          <>
            {tab === 0 && <TodayPage profile={profile} onLogin={login} voteAreaRef={voteRef} />}
            {tab === 1 && <ArchivePage />}
            {tab === 2 && <ReportPage profile={profile} onLogin={login} />}
          </>
        )}
      </div>

      {tour.index >= 0 && (
        <CoachMark
          targetRef={tourSteps[tour.index].ref}
          message={tourSteps[tour.index].message}
          index={tour.index}
          total={tourSteps.length}
          onSkip={tour.skip}
        />
      )}
    </div>
  );
}

export default App;
