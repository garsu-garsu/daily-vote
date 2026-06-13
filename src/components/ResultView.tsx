import { Badge } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import type { Choice, Question, VoteResult } from "../types";

interface Props {
  question: Question;
  result: VoteResult;
  /** 내 선택(투표했다면). 없으면 강조 없이 분포만. */
  myChoice?: Choice;
  /** 연령대·성별 상세 분포까지 보여줄지 (광고 게이트 뒤 콘텐츠) */
  showDetail?: boolean;
}

function Bar({
  question,
  percentA,
  myChoice,
}: {
  question: Question;
  percentA: number;
  myChoice?: Choice;
}) {
  const percentB = 100 - percentA;
  const aWins = percentA >= percentB;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          height: 48,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.grey200,
        }}
      >
        <div
          style={{
            width: `${percentA}%`,
            backgroundColor: aWins ? colors.blue500 : colors.blue200,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            color: aWins ? colors.white : colors.grey700,
            fontWeight: 700,
            fontSize: 15,
            transition: "width 0.5s ease",
          }}
        >
          {percentA}%
        </div>
        <div
          style={{
            width: `${percentB}%`,
            backgroundColor: !aWins ? colors.red500 : colors.red200,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 12,
            color: !aWins ? colors.white : colors.grey700,
            fontWeight: 700,
            fontSize: 15,
            transition: "width 0.5s ease",
          }}
        >
          {percentB}%
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          color: colors.grey600,
        }}
      >
        <span
          style={{
            fontWeight: myChoice === "A" ? 700 : 400,
            color: myChoice === "A" ? colors.blue600 : colors.grey600,
          }}
        >
          {question.emojiA} {question.optionA}
          {myChoice === "A" ? " · 내 선택" : ""}
        </span>
        <span
          style={{
            fontWeight: myChoice === "B" ? 700 : 400,
            color: myChoice === "B" ? colors.red600 : colors.grey600,
          }}
        >
          {question.optionB} {question.emojiB}
          {myChoice === "B" ? " · 내 선택" : ""}
        </span>
      </div>
    </div>
  );
}

function MiniBar({ percentA }: { percentA: number }) {
  const percentB = 100 - percentA;
  const aWins = percentA >= percentB;
  return (
    <div
      style={{
        display: "flex",
        height: 24,
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: colors.grey200,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <div
        style={{
          width: `${percentA}%`,
          backgroundColor: aWins ? colors.blue500 : colors.blue200,
          color: aWins ? colors.white : colors.grey700,
          display: "flex",
          alignItems: "center",
          paddingLeft: 6,
        }}
      >
        {percentA}
      </div>
      <div
        style={{
          width: `${percentB}%`,
          backgroundColor: !aWins ? colors.red500 : colors.red200,
          color: !aWins ? colors.white : colors.grey700,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 6,
        }}
      >
        {percentB}
      </div>
    </div>
  );
}

export function ResultView({ question, result, myChoice, showDetail = false }: Props) {
  const mine = myChoice ? (myChoice === "A" ? result.percentA : result.percentB) : null;
  const isMinority = mine != null && mine < 50;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {mine != null && result.total > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 14px",
            borderRadius: 12,
            backgroundColor: isMinority ? colors.red50 : colors.blue50,
          }}
        >
          <Badge size="small" color={isMinority ? "red" : "blue"} variant="fill">
            {isMinority ? "소수파" : "다수파"}
          </Badge>
          <span style={{ fontSize: 15, fontWeight: 600, color: colors.grey800 }}>
            당신은 {mine}% {isMinority ? "소수파" : "다수파"}예요
          </span>
        </div>
      )}

      <Bar question={question} percentA={result.percentA} myChoice={myChoice} />

      <div style={{ fontSize: 13, color: colors.grey500 }}>
        {result.total > 0
          ? `총 ${result.total.toLocaleString()}명 참여`
          : "아직 집계 전이에요 — 첫 투표의 주인공이 되어보세요"}
      </div>

      {showDetail && result.total > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
          {result.byAge.length > 0 && <Section title="연령대별" rows={result.byAge} />}
          {result.byGender.length > 0 && <Section title="성별" rows={result.byGender} />}
          <div style={{ fontSize: 12, color: colors.grey400 }}>
            * 인구통계는 토스 로그인에 동의한 참여자 기준이에요.
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; percentA: number }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.grey700 }}>{title}</div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 48, fontSize: 13, color: colors.grey600 }}>{r.label}</span>
          <div style={{ flex: 1 }}>
            <MiniBar percentA={r.percentA} />
          </div>
        </div>
      ))}
    </div>
  );
}
