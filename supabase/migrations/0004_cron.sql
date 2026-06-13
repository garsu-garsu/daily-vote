-- 매일 KST 자정(= UTC 15:00)에 마감 질문 결과를 머티리얼라이즈.
-- pg_cron이 활성화된 프로젝트에서만 스케줄을 등록해요. (대시보드 Database > Extensions에서 pg_cron 활성화)
-- 미활성 환경에서도 마이그레이션이 실패하지 않도록 가드로 감쌌어요.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    -- 기존 동일 작업이 있으면 지우고 다시 등록 (멱등)
    perform cron.unschedule(jobid)
      from cron.job
     where jobname = 'refresh-results-kst-midnight';

    perform cron.schedule(
      'refresh-results-kst-midnight',
      '0 15 * * *',                              -- UTC 15:00 = KST 00:00
      $cron$ select public.refresh_due_results(); $cron$
    );
  else
    raise notice 'pg_cron not available — 결과 자동 집계 스케줄을 건너뜁니다. 대시보드에서 pg_cron을 활성화한 뒤 이 마이그레이션을 다시 실행하세요.';
  end if;
end
$$;
