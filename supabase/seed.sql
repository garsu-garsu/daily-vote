-- 질문 시드. ord 0 = 오늘, 1 = 어제 ... (publish_date = KST 오늘 - ord)
-- src/data/questions.ts 와 동일한 목록이에요. 재실행해도 안전(upsert).

insert into public.questions (id, category, title, option_a, option_b, emoji_a, emoji_b, publish_date)
select id, category, title, option_a, option_b, emoji_a, emoji_b, public.kst_today() - ord
from (values
  ('q-tangsuyuk',       '음식',   '탕수육은 어떻게 먹어야 할까요?',          '부먹',            '찍먹',            '🍯','🥢', 0),
  ('q-pineapple-pizza', '음식',   '피자에 파인애플, 올려도 될까요?',          '올려도 돼요',     '절대 안 돼요',    '🍍','🙅', 1),
  ('q-toothpaste',      '생활',   '치약은 어떻게 짜야 마음이 편한가요?',      '끝부터 차곡차곡', '아무데나 꾹',     '📏','🤏', 2),
  ('q-mint-choco',      '음식',   '민트초코, 당신의 선택은?',                '치약파 (싫어요)', '디저트파 (좋아요)','🪥','🍫', 3),
  ('q-shower-time',     '생활',   '샤워는 언제 하는 게 국룰일까요?',          '아침',            '자기 전',         '🌅','🌙', 4),
  ('q-coffee',          '음식',   '여름에도 따뜻한 아메리카노 마시나요?',     '사계절 아아',     '겨울엔 따아',     '🧊','☕', 5),
  ('q-spoiler',         '콘텐츠', '영화 결말 스포, 괜찮나요?',                '스포 OK',         '절대 금지',       '🗣️','🤐', 6),
  ('q-payday',          '소비',   '월급 들어오면 가장 먼저?',                '일단 저축',       '나를 위한 소비',  '🏦','🛍️', 7),
  ('q-ramen',           '음식',   '라면에 계란, 어떻게 넣나요?',              '풀어서',          '통째로',          '🌀','🥚', 8),
  ('q-binge',           '콘텐츠', '드라마는 어떻게 보나요?',                  '정주행 몰아보기', '매주 본방 사수',  '📺','🗓️', 9),
  ('q-socks',           '생활',   '양말은 어떻게 벗어두나요?',                '뒤집어서 휙',     '예쁘게 펴서',     '🧦','✨', 10),
  ('q-fried-chicken',   '음식',   '치킨은 역시?',                            '후라이드',        '양념',            '🍗','🌶️', 11),
  ('q-online-shop',     '소비',   '온라인 장바구니, 당신은?',                '바로 결제',       '넣어두고 고민',   '⚡','🤔', 12),
  ('q-music',           '콘텐츠', '노래 들을 때 가사, 중요한가요?',           '가사 중요',       '멜로디면 충분',   '📝','🎵', 13),
  ('q-icecream',        '음식',   '아이스크림은 어떻게 먹나요?',              '베어 먹기',       '핥아 먹기',       '🦷','👅', 14),
  ('q-bed',             '생활',   '아침에 이불은?',                          '정리하고 나가기', '그냥 두기',       '🛏️','🌀', 15),
  ('q-burger',          '음식',   '햄버거, 어떻게 먹나요?',                  '포장 벗기고 손으로','포장째 잡고',    '🍔','🧻', 16),
  ('q-travel',          '생활',   '여행 스타일은?',                          '계획 빼곡',       '발길 닿는 대로',  '🗺️','🎲', 17),
  ('q-gimbap',          '음식',   '김밥 꽁다리, 누가 먹나요?',                '내가 먹어요',     '남겨둬요',        '😋','🙅', 18),
  ('q-phone',           '생활',   '휴대폰 화면, 평소에?',                    '꽉 찬 앱 정리',   '알림 빨간 점 OK', '📱','🔴', 19)
) as q(id, category, title, option_a, option_b, emoji_a, emoji_b, ord)
on conflict (id) do update
  set category = excluded.category,
      title = excluded.title,
      option_a = excluded.option_a,
      option_b = excluded.option_b,
      emoji_a = excluded.emoji_a,
      emoji_b = excluded.emoji_b,
      publish_date = excluded.publish_date;
