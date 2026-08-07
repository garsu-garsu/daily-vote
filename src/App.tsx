import { Tab, Top } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useState } from "react";
import "./App.css";
import { useSession } from "./hooks/useSession";
import { TodayPage } from "./pages/TodayPage";
import { ArchivePage } from "./pages/ArchivePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ReportPage } from "./pages/ReportPage";

const TABS = ["오늘 투표", "지난 결과", "내 성향"] as const;
const ONBOARDED_KEY = "daily-vote:onboarded";

function App() {
  const [tab, setTab] = useState(0); // 0 = 오늘 투표 — 소개 화면을 닫으면 바로 여기로 와요.
  // 세션 준비를 기다리지 않아요 — 오늘 질문은 로그인 없이도 바로 보여요.
  const { profile, error, login } = useSession();
  // 첫 실행이면 소개 화면부터 — 한 번 보고 나면 다시 뜨지 않아요.
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) != null,
  );

  if (!onboarded) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: colors.white }}>
        <OnboardingPage
          onStart={() => {
            localStorage.setItem(ONBOARDED_KEY, "1");
            setOnboarded(true);
            setTab(0);
          }}
        />
      </div>
    );
  }

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

      <div style={{ padding: "0 12px" }}>
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
            {tab === 0 && <TodayPage profile={profile} onLogin={login} />}
            {tab === 1 && <ArchivePage />}
            {tab === 2 && <ReportPage profile={profile} onLogin={login} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
