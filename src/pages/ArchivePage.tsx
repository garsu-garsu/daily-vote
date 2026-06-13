import { BoardRow, Badge, Loader } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";
import { useEffect, useState } from "react";
import { ResultView } from "../components/ResultView";
import { formatKorean, kstTodayString } from "../lib/kst";
import { fetchPublishedQuestions } from "../data/questions";
import { fetchResult } from "../data/results";
import { fetchMyVotes } from "../data/votes";
import type { Choice, Question, VoteResult } from "../types";

interface Row {
  question: Question;
  result: VoteResult | null;
  myChoice?: Choice;
}

export function ArchivePage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const today = kstTodayString();
      const [questions, votes] = await Promise.all([
        fetchPublishedQuestions(),
        fetchMyVotes(),
      ]);
      const past = questions.filter((q) => q.publishDate < today); // 결과 공개분만
      const results = await Promise.all(
        past.map((q) => fetchResult(q.id).catch(() => null)),
      );
      if (!alive) return;
      setRows(
        past.map((q, i) => ({ question: q, result: results[i], myChoice: votes[q.id] })),
      );
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading)
    return (
      <div style={{ padding: "48px 20px", display: "flex", justifyContent: "center" }}>
        <Loader size="medium" />
      </div>
    );

  if (rows.length === 0)
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: colors.grey500 }}>
        아직 공개된 지난 결과가 없어요.
      </div>
    );

  return (
    <div style={{ padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 4 }}>
      <p style={{ margin: "0 0 8px", fontSize: 14, color: colors.grey500 }}>
        지난 다수결 결과를 다시 볼 수 있어요.
      </p>
      {rows.map(({ question, result, myChoice }) => {
        const winnerLabel =
          result == null
            ? ""
            : result.percentA >= result.percentB
              ? question.optionA
              : question.optionB;
        const winnerPercent = result ? Math.max(result.percentA, result.percentB) : 0;
        return (
          <BoardRow
            key={question.id}
            title={question.title}
            prefix={
              <Badge size="xsmall" color="teal" variant="weak">
                {formatKorean(question.publishDate)}
              </Badge>
            }
            icon={<BoardRow.ArrowIcon />}
          >
            <div style={{ paddingBottom: 16 }}>
              {result != null && result.total > 0 && (
                <div style={{ fontSize: 13, color: colors.grey500, marginBottom: 12 }}>
                  {winnerPercent}%가 '{winnerLabel}'를 골랐어요
                  {myChoice ? " · 나도 참여했어요" : ""}
                </div>
              )}
              {result != null ? (
                <ResultView question={question} result={result} myChoice={myChoice} showDetail />
              ) : (
                <span style={{ fontSize: 13, color: colors.grey400 }}>
                  아직 집계 전이에요.
                </span>
              )}
            </div>
          </BoardRow>
        );
      })}
    </div>
  );
}
