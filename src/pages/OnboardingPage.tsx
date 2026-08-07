import { Button, Top } from "@toss/tds-mobile";
import { colors } from "@toss/tds-colors";

interface Props {
  onStart: () => void;
}

const STEPS = [
  {
    emoji: "🗳️",
    title: "오늘의 질문에 3초 투표해요",
    body: "매일 새 질문이 하나씩 올라와요. 둘 중 하나만 고르면 끝이에요.",
  },
  {
    emoji: "📊",
    title: "바로 전국 결과를 봐요",
    body: "고르는 순간 지금까지 모인 표가 몇 대 몇인지 보여드려요. 내가 다수인지 소수인지 알 수 있어요.",
  },
  {
    emoji: "📈",
    title: "지난 투표와 내 리포트도 있어요",
    body: "놓친 질문은 '지난 투표'에서 볼 수 있고, '내 리포트'에는 내가 얼마나 다수 쪽이었는지 쌓여요.",
  },
];

/** 첫 실행에 한 번만 보여주는 소개 화면. */
export function OnboardingPage({ onStart }: Props) {
  return (
    <div style={{ paddingBottom: 32 }}>
        {/* 앱 이름은 토스 상단 바가 이미 보여줘요 — 여기서 또 쓰면 헤더가 겹쳐 보여요. */}
      <Top
        title={<Top.TitleParagraph size={26}>오늘의 질문에 투표해요</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            3초 투표하고 전국의 취향을 확인해요
          </Top.SubtitleParagraph>
        }
      />

      <div style={{ padding: "8px 20px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((s) => (
            <div
              key={s.title}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                backgroundColor: colors.grey50,
                borderRadius: 16,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 28, lineHeight: 1.2 }}>{s.emoji}</div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 15, fontWeight: 800, color: colors.grey800 }}
                >
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: colors.grey600,
                    marginTop: 4,
                  }}
                >
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <Button size="xlarge" display="full" onClick={onStart}>
            시작하기
          </Button>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 18,
            fontSize: 12,
            color: colors.grey500,
            lineHeight: 1.6,
          }}
        >
          결과는 참여한 분들의 응답을 모은 것이라 실제 여론과는 달라요.
        </div>
      </div>
    </div>
  );
}
