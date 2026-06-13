import { Button, Loader, ProgressBar, useToast } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useEffect, useState } from "react";
import { fetchMyStats, type MyStats } from "../data/stats";
import type { Profile } from "../types";

const STREAK_GOAL = 7;

interface Props {
  profile: Profile | null;
  onLogin: () => Promise<void>;
}

export function ReportPage({ profile, onLogin }: Props) {
  const toast = useToast();
  const [stats, setStats] = useState<MyStats | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMyStats()
      .then((s) => alive && setStats(s))
      .catch((e) => console.error(e));
    return () => {
      alive = false;
    };
  }, []);

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      await onLogin();
      toast.openToast("토스 로그인 완료! 이제 연령·성별 분포에도 반영돼요.");
    } catch (e) {
      toast.openToast("로그인은 토스앱/샌드박스앱에서 동작해요");
      console.error(e);
    } finally {
      setLoggingIn(false);
    }
  };

  if (stats == null)
    return (
      <div style={{ padding: "48px 20px", display: "flex", justifyContent: "center" }}>
        <Loader size="medium" />
      </div>
    );

  const streakRatio = Math.min(stats.streak / STREAK_GOAL, 1);
  const isGuest = profile?.tossUserKey == null;

  return (
    <div style={{ padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ margin: 0, fontSize: 14, color: colors.grey500 }}>나의 취향 통계를 모아봤어요.</p>

      <div
        style={{
          padding: 20,
          borderRadius: 16,
          backgroundColor: colors.blue50,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 32 }}>🔥</span>
          <span style={{ fontSize: 32, fontWeight: 800, color: colors.blue600 }}>{stats.streak}일</span>
          <span style={{ fontSize: 15, color: colors.grey600 }}>연속 투표 중</span>
        </div>
        <ProgressBar progress={streakRatio} size="normal" color={colors.blue500} animate />
        <span style={{ fontSize: 13, color: colors.grey600 }}>
          {stats.streak >= STREAK_GOAL
            ? "7일 연속 달성! 토스포인트를 받을 수 있어요 🎉"
            : `7일 연속까지 ${STREAK_GOAL - stats.streak}일 남았어요`}
        </span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="총 투표 수" value={`${stats.totalVotes}`} unit="개" />
        <StatCard label="다수파 적중률" value={`${stats.majorityRate}`} unit="%" />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="다수파였던 횟수" value={`${stats.majorityCount}`} unit="번" />
        <StatCard label="소수파였던 횟수" value={`${stats.minorityCount}`} unit="번" accent />
      </div>

      {isGuest && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            backgroundColor: colors.grey50,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 14, color: colors.grey700 }}>
            토스로 로그인하면 연령대·성별 분포에도 내 투표가 반영돼요.
          </span>
          <Button display="full" size="large" loading={loggingIn} onClick={handleLogin}>
            토스로 로그인
          </Button>
        </div>
      )}

      {stats.totalVotes === 0 && (
        <div
          style={{
            padding: 20,
            borderRadius: 16,
            backgroundColor: colors.grey50,
            textAlign: "center",
            fontSize: 14,
            color: colors.grey600,
          }}
        >
          아직 투표 기록이 없어요.
          <br />
          오늘의 질문에 첫 투표를 해보세요!
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.grey50,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 13, color: colors.grey500 }}>{label}</span>
      <span>
        <span style={{ fontSize: 26, fontWeight: 800, color: accent ? colors.red500 : colors.grey800 }}>
          {value}
        </span>
        <span style={{ fontSize: 14, color: colors.grey500, marginLeft: 2 }}>{unit}</span>
      </span>
    </div>
  );
}
