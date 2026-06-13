import { Badge, Button, Loader, useToast } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useCallback, useEffect, useState } from "react";
import { ResultView } from "../components/ResultView";
import { useAdGate } from "../hooks/useAdGate";
import { EVENT, track } from "../lib/analytics";
import { formatKoreanWithDay, kstTodayString, timeUntilMidnight } from "../lib/kst";
import { fetchTodayQuestion } from "../data/questions";
import { fetchMyVotes, submitVote } from "../data/votes";
import { fetchResult, fetchResultNow } from "../data/results";
import { shareResult } from "../data/share";
import type { Choice, Question, VoteResult } from "../types";

export function TodayPage() {
  const toast = useToast();
  const ad = useAdGate();

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [myChoice, setMyChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<VoteResult | null>(null);
  const [detail, setDetail] = useState(false); // 광고/공유로 상세 분포 잠금 해제

  const isToday = question != null && question.publishDate >= kstTodayString();

  useEffect(() => {
    let alive = true;
    (async () => {
      const q = await fetchTodayQuestion();
      if (!alive || q == null) {
        if (alive) setLoading(false);
        return;
      }
      setQuestion(q);
      const votes = await fetchMyVotes();
      const choice = votes[q.id] ?? null;
      setMyChoice(choice);
      // 과거 질문(=결과 공개)이면 결과를 바로 불러와요.
      if (q.publishDate < kstTodayString()) {
        setResult(await fetchResult(q.id).catch(() => null));
        setDetail(true);
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleVote = async (choice: Choice) => {
    if (question == null) return;
    setMyChoice(choice); // 낙관적 반영
    try {
      await submitVote(question.id, choice);
      track(EVENT.voteCast, { question_id: question.id, choice });
    } catch (e) {
      setMyChoice(null);
      toast.openToast("투표에 실패했어요. 잠시 후 다시 시도해 주세요.");
      console.error(e);
    }
  };

  const revealNow = useCallback(
    async (gate: "ad" | "share") => {
      if (question == null) return;
      const r = await fetchResultNow(question.id).catch(() => null);
      if (r == null) {
        toast.openToast("결과를 불러오지 못했어요.");
        return;
      }
      setResult(r);
      setDetail(true);
      track(EVENT.resultViewed, { question_id: question.id, gate });
    },
    [question, toast],
  );

  const handleWatchAd = () => ad.watchThen(() => revealNow("ad"), "result");

  const handleShare = async () => {
    if (question == null || myChoice == null) return;
    const r = result ?? (await fetchResultNow(question.id).catch(() => null));
    const mine = r ? (myChoice === "A" ? r.percentA : r.percentB) : null;
    const pick = myChoice === "A" ? question.optionA : question.optionB;
    const msg =
      mine != null && mine < 50
        ? `[오늘의 다수결] "${question.title}"\n난 ${pick} — ${mine}% 소수파였어요 😎\n당신의 선택은?`
        : `[오늘의 다수결] "${question.title}"\n난 ${pick} 골랐어요. 당신의 선택은?`;
    const shared = await shareResult(msg);
    if (!shared) toast.openToast("공유는 토스앱/샌드박스앱에서 동작해요");
    track(EVENT.shareCompleted, { context: "result" });
    await revealNow("share");
  };

  if (loading) return <Centered><Loader size="medium" /></Centered>;
  if (question == null)
    return (
      <Centered>
        <span style={{ color: colors.grey500 }}>오늘의 질문을 준비 중이에요.</span>
      </Centered>
    );

  return (
    <div style={{ padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Badge size="small" color="teal" variant="weak">
          {question.category}
        </Badge>
        <span style={{ fontSize: 13, color: colors.grey500 }}>
          {formatKoreanWithDay(question.publishDate)} {isToday ? "오늘의 질문" : "지난 질문"}
        </span>
      </div>

      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, lineHeight: 1.35, color: colors.grey800 }}>
        {question.title}
      </h2>

      {myChoice == null ? (
        <VoteButtons question={question} onVote={handleVote} />
      ) : result != null ? (
        <ResultView question={question} result={result} myChoice={myChoice} showDetail={detail} />
      ) : (
        <LockedResult
          pick={myChoice === "A" ? question.optionA : question.optionB}
          adLabel={ad.ready ? "광고 보고 지금 결과 보기" : "지금 결과 보기"}
          onWatchAd={handleWatchAd}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "64px 20px", display: "flex", justifyContent: "center" }}>{children}</div>
  );
}

function VoteButtons({
  question,
  onVote,
}: {
  question: Question;
  onVote: (c: Choice) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ margin: 0, fontSize: 14, color: colors.grey500 }}>
        3초면 충분해요. 하나만 골라주세요.
      </p>
      <OptionButton emoji={question.emojiA} label={question.optionA} color={colors.blue500} onClick={() => onVote("A")} />
      <OptionButton emoji={question.emojiB} label={question.optionB} color={colors.red500} onClick={() => onVote("B")} />
    </div>
  );
}

function OptionButton({
  emoji,
  label,
  color,
  onClick,
}: {
  emoji: string;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none",
        border: `2px solid ${colors.grey200}`,
        background: colors.white,
        borderRadius: 16,
        padding: "22px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ fontSize: 32 }}>{emoji}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color }}>{label}</span>
    </button>
  );
}

function LockedResult({
  pick,
  adLabel,
  onWatchAd,
  onShare,
}: {
  pick: string;
  adLabel: string;
  onWatchAd: () => void;
  onShare: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          padding: 20,
          borderRadius: 16,
          backgroundColor: colors.grey50,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 40 }}>🗳️</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.grey800 }}>
          투표 완료! '{pick}' 선택했어요
        </div>
        <div style={{ fontSize: 14, color: colors.grey600 }}>결과는 내일 0시에 공개돼요</div>
        <div style={{ fontSize: 13, color: colors.grey500 }}>
          공개까지 약 {timeUntilMidnight()} 남았어요
        </div>
      </div>

      <p style={{ margin: 0, fontSize: 14, color: colors.grey500, textAlign: "center" }}>
        기다리거나, 지금 바로 결과를 확인하세요
      </p>

      <Button display="full" size="large" onClick={onWatchAd}>
        {adLabel}
      </Button>
      <Button display="full" size="large" color="dark" variant="weak" onClick={onShare}>
        결과 카드 공유하고 보기
      </Button>
    </div>
  );
}
