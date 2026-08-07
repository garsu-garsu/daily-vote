import { Loader, Tab, Top } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useState } from "react";
import "./App.css";
import { useSession } from "./hooks/useSession";
import { TodayPage } from "./pages/TodayPage";
import { ArchivePage } from "./pages/ArchivePage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ReportPage } from "./pages/ReportPage";

const TABS = ["오늘", "지난 투표", "내 리포트"] as const;
const ONBOARDED_KEY = "daily-vote:onboarded";

function App() {
  const [tab, setTab] = useState(0);
  const { loading, profile, error, login } = useSession();
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
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.white }}>
      <Top
        title={<Top.TitleParagraph size={22}>오늘의 다수결</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            3초 투표하고 전국의 취향을 확인해요
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
        {loading ? (
          <div style={{ padding: "64px 20px", display: "flex", justifyContent: "center" }}>
            <Loader size="medium" label="불러오는 중이에요" />
          </div>
        ) : error ? (
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
