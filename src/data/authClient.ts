import { appLogin } from "@apps-in-toss/web-framework";

import { SUPABASE_URL } from "../lib/env";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";
import { getMyProfile } from "./profile";

/**
 * 토스 로그인 → Edge Function(toss-auth)에서 인가코드를 교환하고
 * 인구통계 동의 데이터를 수집한 뒤 Supabase 세션을 발급받아요.
 * 둘러보기(익명)로 쓰던 중이면 그 계정을 토스 계정으로 이어붙여요.
 */
export async function loginWithToss(): Promise<Profile> {
  const result = await appLogin();
  const r = result as { authorizationCode?: string; code?: string; referrer?: string };
  const authorizationCode = r.authorizationCode ?? r.code;
  const referrer = r.referrer ?? "";
  if (authorizationCode == null) {
    throw new Error("토스 로그인 인가코드를 받지 못했어요.");
  }

  const { data: current } = await supabase.auth.getUser();
  const anonymousUserId = current.user?.id ?? null;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/toss-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorizationCode, referrer, anonymousUserId }),
  });
  if (!res.ok) throw new Error(`로그인 처리 실패 (${res.status})`);

  const { accessToken, refreshToken } = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;

  const profile = await getMyProfile();
  if (profile == null) throw new Error("프로필을 불러오지 못했어요.");
  return profile;
}

/**
 * 토스 로그인 없이 익명으로 입장해요. (인구통계 없음 → 전국 비율만, 연령/성별 분포엔 미집계)
 * 프로필이 없으면 최소 정보로 생성해요.
 */
export async function devSignIn(): Promise<Profile> {
  const { data: existing } = await supabase.auth.getUser();
  let uid = existing.user?.id;

  if (uid == null) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    uid = data.user?.id;
  }
  if (uid == null) throw new Error("익명 로그인에 실패했어요.");

  const existingProfile = await getMyProfile();
  if (existingProfile != null) return existingProfile;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: uid })
    .select("*")
    .single();
  if (error) throw error;

  return {
    id: data.id,
    tossUserKey: null,
    gender: null,
    ageBand: null,
    createdAt: data.created_at,
  };
}

/** 세션이 있으면 그 프로필을, 없으면 익명 로그인 후 프로필을 반환해요. */
export async function ensureSession(): Promise<Profile> {
  const profile = await getMyProfile();
  if (profile != null) return profile;
  return devSignIn();
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
