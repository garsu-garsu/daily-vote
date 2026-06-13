import { useCallback, useEffect, useState } from "react";

import { ensureSession, loginWithToss } from "../data/authClient";
import { EVENT, track } from "../lib/analytics";
import type { Profile } from "../types";

interface SessionState {
  loading: boolean;
  profile: Profile | null;
  error: string | null;
  /** 토스 로그인으로 인구통계 동의받기 (익명 → 토스 계정 승격) */
  login: () => Promise<void>;
}

/** 앱 진입 시 세션을 보장해요. 토스/익명 어느 쪽이든 투표는 가능해요. */
export function useSession(): SessionState {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    ensureSession()
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        track(EVENT.signup, { method: p.tossUserKey ? "toss" : "guest" });
      })
      .catch((e) => alive && setError(String(e instanceof Error ? e.message : e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async () => {
    track(EVENT.loginUpsellClick);
    const p = await loginWithToss();
    setProfile(p);
  }, []);

  return { loading, profile, error, login };
}
