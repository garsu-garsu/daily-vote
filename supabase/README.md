# 오늘의 다수결 — 백엔드 (Supabase)

돛단배(sailboat)의 검증된 인증 패턴을 그대로 따라요: **toss-auth Edge Function이 GoTrue 세션을 발급**하고,
신원은 `profiles.id = auth.uid()`(uuid). 토스 미동의/개발 환경은 **익명 로그인**으로 입장해요.

## 배포 상태 (live)

- 프로젝트: `daily-vote` (`wiynloufgqbdygawcevw`, region ap-south-1, org는 sail-boat와 동일)
- 마이그레이션 0001~0005 적용 완료, `toss-auth` 함수 배포 완료
- **익명 로그인 활성화됨** (`external_anonymous_users_enabled = true`) — 투표에 필수
- 검증: 익명 로그인 → 프로필 → 투표 → 중복차단(1인1표) → `get_result_now` 정상 (테스트 데이터는 정리함)

## 구성

```
supabase/
├─ config.toml                 # [functions.toss-auth] verify_jwt=false
├─ seed.sql                    # 질문 시드 (publish_date = KST 오늘 - ord)
├─ migrations/
│  ├─ 0001_init.sql            # profiles(id=auth.uid) / questions / votes / vote_results + kst_today()
│  ├─ 0002_rls.sql             # RLS (본인 행만, 1인1표, 결과 익일 공개)
│  ├─ 0003_functions.sql       # 집계 머티리얼라이즈 + get_result_now RPC (age_band→한글 라벨)
│  ├─ 0004_cron.sql            # KST 자정 결과 집계 (pg_cron, 가드)
│  └─ 0005_seed_questions.sql  # seed.sql 동일 내용 (db push로 원격에도 시드)
└─ functions/toss-auth/index.ts  # 인가코드→GoTrue 세션(accessToken/refreshToken), 인구통계 upsert
```

## 데이터 모델

- **profiles**: Supabase auth 유저와 1:1. `toss_user_key`, `gender('male'|'female')`, `age_band('10s'..'60plus')`.
- **questions**: `publish_date` 도래 시 공개. 공개일 인덱스.
- **votes**: `user_id`(uuid, →profiles) + `question_id` 유일 = 1인 1표. 수정·삭제 불가.
- **vote_results**: 공개 시점에 머티리얼라이즈. RLS는 `publish_date < kst_today()`(어제 이전)만 공개.
- **오늘 결과 '지금 보기'**: `get_result_now(question_id)` security definer RPC (광고/공유 게이트 통과 후 호출).

## 클라이언트 연결 (이미 연결됨)

- 루트 `.env`에 실제 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 들어있어요(gitignore).
- 진입 시 `useSession` → `ensureSession()`(익명 로그인) → 투표 가능. 토스 로그인은 리포트 탭에서 업셀.
- 데이터: `data/questions.ts`·`votes.ts`·`results.ts`·`stats.ts` (모두 supabase-js).

## 토스 실연동 시 채울 부분 (현재 dev mock으로 동작)

`functions/toss-auth/index.ts`는 `TOSS_DECRYPT_KEY`가 없으면 **개발용 mock**(가짜 userKey, 20대 여성)으로 동작해요.
실연동하려면 콘솔 발급 시크릿을 넣으세요:

```bash
supabase secrets set \
  TOSS_MTLS_CERT="$(cat cert.pem)" TOSS_MTLS_KEY="$(cat key.pem)" \
  TOSS_DECRYPT_KEY=... TOSS_DECRYPT_AAD=...
```
- `generate-token` / `login-me` 엔드포인트·응답 스키마, AES-GCM 복호화 형식은 콘솔 발급 정보에 맞춰 확인.
- 복호화 키가 hex 로 발급되면 `TOSS_DECRYPT_KEY_ENCODING=hex` 를 함께 설정하세요(기본 base64).
- 광고: 콘솔에서 daily-vote 앱의 보상형 광고 그룹 ID 발급 후 `.env`의 `VITE_AD_GROUP_ID_REWARDED`에 입력.

## 운영 명령

```bash
supabase db push                       # 마이그레이션 적용 (원격)
supabase functions deploy toss-auth    # 함수 배포
# pg_cron: 대시보드 Database > Extensions 활성화 후 0004 재실행 → KST 자정 자동 집계
```
