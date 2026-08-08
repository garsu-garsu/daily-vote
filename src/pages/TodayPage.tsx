import { Badge, Button, Loader, useToast } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useCallback, useEffect, useState } from "react";
import { ResultView } from "../components/ResultView";
import { ImageResultBanner, ResultBanner } from "../components/ResultBanner";
import { useAdGate } from "../hooks/useAdGate";
import { useInterstitial } from "../hooks/useInterstitial";
import { EVENT, track } from "../lib/analytics";
import {
  formatKorean,
  formatKoreanWithDay,
  kstTodayString,
  timeUntilMidnight,
} from "../lib/kst";
import { buildShareMessage } from "../lib/resultCopy";
import { fetchPublishedQuestions, fetchTodayQuestion } from "../data/questions";
import { fetchMyVotes, submitVote } from "../data/votes";
import { fetchResult, fetchResultNow } from "../data/results";
import { shareResult } from "../data/share";
import { hasAgreedNotify, isNotifySupported, requestNotify } from "../lib/notify";
import type { Choice, Profile, Question, VoteResult } from "../types";

interface Props {
  profile: Profile | null;
  onLogin: () => Promise<void>;
}

export function TodayPage({ profile, onLogin }: Props) {
  const toast = useToast();
  const ad = useAdGate();
  const showInterstitial = useInterstitial();
  const [loggingIn, setLoggingIn] = useState(false);
  const isGuest = profile?.tossUserKey == null;

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

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [myChoice, setMyChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<VoteResult | null>(null);
  const [detail, setDetail] = useState(false); // 광고로 연령·성별 상세 분포 잠금 해제

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
      if (alive) setLoading(false); // 질문부터 바로 보여줘요 (투표까지 3초)

      const votes = await fetchMyVotes().catch(() => ({}) as Record<string, Choice>);
      if (!alive) return;
      const choice = votes[q.id] ?? null;
      setMyChoice(choice);

      const past = q.publishDate < kstTodayString();
      if (past) {
        // 지난 질문(=결과 공개)이면 상세 분포까지 바로. (광고 게이트 없는 결과 화면 → 전면 1회)
        // 아직 집계 전이면 즉시 집계로 대체해요.
        const r = await fetchResult(q.id).catch(() => null);
        setResult(r ?? (await fetchResultNow(q.id).catch(() => null)));
        setDetail(true);
        showInterstitial();
      } else if (choice != null) {
        // 이미 투표했으면 지금까지 모인 전국 결과를 바로 보여줘요.
        setResult(await fetchResultNow(q.id).catch(() => null));
      }
    })();
    return () => {
      alive = false;
    };
  }, [showInterstitial]);

  /** 지금까지 모인 전국 결과를 불러와요. (투표 직후 / 실패 시 다시 시도) */
  const reloadResult = useCallback(async () => {
    if (question == null) return;
    const r = await fetchResultNow(question.id).catch(() => null);
    if (r == null) {
      toast.openToast("결과를 불러오지 못했어요.");
      return;
    }
    setResult(r);
  }, [question, toast]);

  const handleVote = async (choice: Choice) => {
    if (question == null || myChoice != null) return; // 연타로 두 번 제출되지 않게
    setMyChoice(choice); // 낙관적 반영
    try {
      await submitVote(question.id, choice);
      track(EVENT.voteCast, { question_id: question.id, choice });
    } catch (e) {
      setMyChoice(null);
      toast.openToast("투표에 실패했어요. 잠시 후 다시 시도해 주세요.");
      console.error(e);
      return;
    }
    // 투표 직후 바로 전국 결과 공개 — 연령·성별 상세 분포만 광고 뒤에 남겨요.
    await reloadResult();
    track(EVENT.resultViewed, { question_id: question.id, gate: "vote" });
  };

  const revealDetail = useCallback(async () => {
    if (question == null) return;
    const r = await fetchResultNow(question.id).catch(() => null);
    if (r != null) setResult(r);
    setDetail(true);
    track(EVENT.resultViewed, { question_id: question.id, gate: "ad" });
  }, [question]);

  const handleWatchAd = () => ad.watchThen(revealDetail, "detail");

  const handleShare = async () => {
    if (question == null || myChoice == null) return;
    const shared = await shareResult(buildShareMessage(question, myChoice, result));
    if (!shared) {
      toast.openToast("공유는 토스앱/샌드박스앱에서 동작해요");
      return;
    }
    track(EVENT.shareCompleted, { context: "result" });
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
          {formatKoreanWithDay(question.publishDate)}{" "}
          {isToday ? "오늘의 밸런스 게임" : "지난 질문"}
        </span>
      </div>

      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, lineHeight: 1.35, color: colors.grey800 }}>
        {question.title}
      </h2>

      {myChoice == null ? (
        <VoteButtons question={question} onVote={handleVote} />
      ) : result == null ? (
        <div
          style={{
            padding: "32px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Loader size="small" />
          <button
            onClick={() => void reloadResult()}
            style={{
              appearance: "none",
              border: "none",
              background: "none",
              fontSize: 13,
              color: colors.grey500,
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            결과가 안 보이면 다시 시도
          </button>
        </div>
      ) : (
        <>
          <ResultView question={question} result={result} myChoice={myChoice} showDetail={detail} />

          <ShareCta onShare={handleShare} />

          <NotifyCard />

          {!detail && (
            <Button display="full" size="large" color="dark" variant="weak" onClick={handleWatchAd}>
              {ad.ready ? "광고 보고 연령대·성별 분포까지 보기" : "연령대·성별 분포까지 보기"}
            </Button>
          )}

          {isGuest && (
            <LoginUpsell loggingIn={loggingIn} onLogin={handleLogin} />
          )}

          {isToday && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                backgroundColor: colors.blue50,
                fontSize: 14,
                color: colors.blue600,
                textAlign: "center",
              }}
            >
              내일 0시에 새 질문이 올라와요 · {timeUntilMidnight()} 남았어요
            </div>
          )}

          <PreviousResult />
          <ResultBanner />

          <div style={{ fontSize: 12, color: colors.grey400, lineHeight: 1.6 }}>
            결과는 이 투표에 참여한 분들의 응답을 모은 것이라 실제 여론과는 달라요.
          </div>

          {/* 이미지 강조형 배너 — 본문 스크롤의 맨 끝. 끝까지 내려본 사람에게만 보여요. */}
          <ImageResultBanner />
        </>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "64px 20px", display: "flex", justifyContent: "center" }}>{children}</div>
  );
}

function ShareCta({ onShare }: { onShare: () => void }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        backgroundColor: colors.grey50,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 800, color: colors.grey800, textAlign: "center" }}>
        친구는 어느 쪽일까요?
      </div>
      <div style={{ fontSize: 13, color: colors.grey600, textAlign: "center", lineHeight: 1.5 }}>
        오늘 질문과 내 선택을 그대로 보내서 물어볼 수 있어요.
      </div>
      <Button display="full" size="large" onClick={onShare}>
        결과 카드 공유하기
      </Button>
    </div>
  );
}

/** 매일 오후 9시 알림 동의 카드. */
function NotifyCard() {
  const toast = useToast();
  const [agreed, setAgreed] = useState(hasAgreedNotify);

  if (!isNotifySupported()) return null;

  const onNotify = async () => {
    try {
      const result = await requestNotify();
      if (result === "agreementRejected") return;
      setAgreed(true);
      toast.openToast(
        result === "alreadyAgreed" ? "이미 알림을 받고 있어요." : "매일 오후 9시에 알려드릴게요.",
      );
    } catch {
      toast.openToast("알림을 설정하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.grey50,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: colors.grey800 }}>
        매일 오후 9시에 오늘의 질문 알려드릴까요?
      </span>
      <Button
        display="full"
        size="medium"
        variant={agreed ? "fill" : "weak"}
        color={agreed ? "primary" : "dark"}
        onClick={() => void onNotify()}
      >
        {agreed ? "알림 받는 중" : "알림 받기"}
      </Button>
    </div>
  );
}

function LoginUpsell({ loggingIn, onLogin }: { loggingIn: boolean; onLogin: () => void }) {
  return (
    <button
      onClick={onLogin}
      disabled={loggingIn}
      style={{
        appearance: "none",
        border: `1px solid ${colors.blue200}`,
        background: colors.blue50,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: loggingIn ? "default" : "pointer",
        width: "100%",
        opacity: loggingIn ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 15 }}>🇹</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: colors.blue600 }}>
        {loggingIn ? "로그인 중..." : "토스로 로그인하고 연령·성별 분포까지 보기"}
      </span>
    </button>
  );
}

/** 바로 앞 회차 결과 — "매일 새 질문이 온다"를 결과 화면에서 알려주는 자리. */
function PreviousResult() {
  const [row, setRow] = useState<{ question: Question; result: VoteResult } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const questions = await fetchPublishedQuestions().catch(() => [] as Question[]);
      const prev = questions.find((q) => q.publishDate < kstTodayString());
      if (prev == null) return;
      const result = await fetchResult(prev.id).catch(() => null);
      if (alive && result != null && result.total > 0) setRow({ question: prev, result });
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (row == null) return null;
  const { question, result } = row;
  const aWins = result.percentA >= result.percentB;
  const winner = aWins ? question.optionA : question.optionB;
  const emoji = aWins ? question.emojiA : question.emojiB;
  const percent = Math.max(result.percentA, result.percentB);

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.grey50,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 13, color: colors.grey500 }}>
        {formatKorean(question.publishDate)} 다수결 결과
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: colors.grey800 }}>
        {question.title}
      </span>
      <span style={{ fontSize: 14, color: colors.grey600 }}>
        {emoji} {percent}%가 '{winner}'를 골랐어요 · 총 {result.total.toLocaleString()}명 참여
      </span>
    </div>
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
        3초면 충분해요. 하나만 고르면 전국 투표 결과가 바로 나와요.
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
