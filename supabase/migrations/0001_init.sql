-- 오늘의 다수결 — 초기 스키마 (돛단배 인증 패턴: profiles.id = auth.uid())

create extension if not exists pgcrypto;

-- KST(한국 표준시) 오늘 날짜. 투표 마감/결과 공개의 단일 기준.
create or replace function public.kst_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Seoul')::date;
$$;

-- 프로필: Supabase auth 유저와 1:1. toss-auth(service_role)가 인구통계를 기록해요.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  toss_user_key text unique,
  gender        text check (gender in ('male','female')),
  age_band      text check (age_band in ('10s','20s','30s','40s','50s','60plus')),
  created_at    timestamptz not null default now()
);

-- 질문 큐. publish_date가 도래하면 공개돼요.
create table if not exists public.questions (
  id           text primary key,
  category     text not null,
  title        text not null,
  option_a     text not null,
  option_b     text not null,
  emoji_a      text not null default '',
  emoji_b      text not null default '',
  publish_date date not null unique,
  created_at   timestamptz not null default now()
);
create index if not exists questions_publish_date_idx
  on public.questions (publish_date desc);

-- 투표. (user_id, question_id) 유일 = 1인 1표. 수정·삭제 정책 없음(불가).
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  choice      text not null check (choice in ('A','B')),
  created_at  timestamptz not null default now(),
  unique (user_id, question_id)
);
create index if not exists votes_question_idx on public.votes (question_id);

-- 집계 결과. 공개 시점에 머티리얼라이즈(매 조회 count 금지).
create table if not exists public.vote_results (
  question_id     text primary key references public.questions(id) on delete cascade,
  total           int  not null default 0,
  count_a         int  not null default 0,
  count_b         int  not null default 0,
  by_age          jsonb not null default '[]'::jsonb,    -- [{ "label": "20대", "percent_a": 63 }, ...]
  by_gender       jsonb not null default '[]'::jsonb,
  materialized_at timestamptz not null default now()
);
