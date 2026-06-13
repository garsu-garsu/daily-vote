-- Row Level Security 정책 (신원 = auth.uid())

alter table public.profiles     enable row level security;
alter table public.questions    enable row level security;
alter table public.votes        enable row level security;
alter table public.vote_results enable row level security;

-- 프로필: 본인 것만 읽기/생성/수정. 인구통계 컬럼은 toss-auth(service_role)가 채워요.
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_insert_self on public.profiles
  for insert with check (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- 질문: 공개일이 됐거나 지난 질문은 누구나 읽기. 미래 질문은 숨김.
create policy questions_select_published on public.questions
  for select using (publish_date <= public.kst_today());

-- 투표: 본인 행만 읽기.
create policy votes_select_own on public.votes
  for select using (user_id = auth.uid());

-- 투표: 본인 행만, 공개된(오늘 포함) 질문에만 insert.
create policy votes_insert_own on public.votes
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.questions q
      where q.id = question_id and q.publish_date <= public.kst_today()
    )
  );
-- update/delete 정책 없음 → 거부 (1인 1표, 변경 불가)

-- 결과: 익일 공개 원칙. publish_date가 오늘보다 과거인 질문 결과만 누구나 읽기.
-- (오늘 결과 '지금 보기'는 get_result_now RPC — 0003 참고)
create policy results_select_next_day on public.vote_results
  for select using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.publish_date < public.kst_today()
    )
  );
