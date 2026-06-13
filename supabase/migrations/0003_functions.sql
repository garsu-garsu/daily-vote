-- 집계 함수 + 즉시 결과 RPC

-- 특정 질문의 votes(+profiles)를 집계해 vote_results에 upsert해요.
-- age_band 코드(10s..60plus) / gender(male,female)를 한글 라벨로 매핑해서 내려줘요.
create or replace function public.refresh_question_result(p_question_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
  v_a int;
  v_b int;
  v_by_age jsonb;
  v_by_gender jsonb;
begin
  select count(*),
         count(*) filter (where choice = 'A'),
         count(*) filter (where choice = 'B')
    into v_total, v_a, v_b
    from votes
   where question_id = p_question_id;

  -- 연령대별 A 선택 비율(%)
  select coalesce(
           jsonb_agg(jsonb_build_object('label', label, 'percent_a', pct) order by ord),
           '[]'::jsonb)
    into v_by_age
    from (
      select b.label,
             b.ord,
             case when count(v.*) = 0 then 0
                  else round(100.0 * count(v.*) filter (where v.choice = 'A') / count(v.*))
             end as pct
        from (values
                ('10s','10대',1),('20s','20대',2),('30s','30대',3),
                ('40s','40대',4),('50s','50대',5),('60plus','60대+',6)
             ) as b(code, label, ord)
        left join profiles p on p.age_band = b.code
        left join votes v on v.user_id = p.id and v.question_id = p_question_id
       group by b.label, b.ord
    ) age;

  -- 성별 A 선택 비율(%)
  select coalesce(
           jsonb_agg(jsonb_build_object('label', label, 'percent_a', pct) order by ord),
           '[]'::jsonb)
    into v_by_gender
    from (
      select b.label,
             b.ord,
             case when count(v.*) = 0 then 0
                  else round(100.0 * count(v.*) filter (where v.choice = 'A') / count(v.*))
             end as pct
        from (values ('male','남성',1),('female','여성',2)) as b(code, label, ord)
        left join profiles p on p.gender = b.code
        left join votes v on v.user_id = p.id and v.question_id = p_question_id
       group by b.label, b.ord
    ) g;

  insert into vote_results(question_id, total, count_a, count_b, by_age, by_gender, materialized_at)
  values (p_question_id, v_total, v_a, v_b, v_by_age, v_by_gender, now())
  on conflict (question_id) do update
     set total = excluded.total,
         count_a = excluded.count_a,
         count_b = excluded.count_b,
         by_age = excluded.by_age,
         by_gender = excluded.by_gender,
         materialized_at = now();
end;
$$;

-- 마감된(어제 이전) 모든 질문 결과를 머티리얼라이즈. 자정 cron이 호출해요.
create or replace function public.refresh_due_results()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in select id from questions where publish_date < kst_today() loop
    perform refresh_question_result(r.id);
  end loop;
end;
$$;

-- "지금 결과 보기": 광고/공유 게이트 통과 시 클라가 호출. 오늘 질문도 즉시 집계해 반환.
create or replace function public.get_result_now(p_question_id text)
returns public.vote_results
language plpgsql
security definer
set search_path = public
as $$
declare
  res public.vote_results;
begin
  perform refresh_question_result(p_question_id);
  select * into res from vote_results where question_id = p_question_id;
  return res;
end;
$$;

grant execute on function public.get_result_now(text) to anon, authenticated;
grant execute on function public.kst_today() to anon, authenticated;
