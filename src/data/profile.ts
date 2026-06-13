import { supabase } from "../lib/supabase";
import type { Profile } from "../types";
import { toProfile } from "./mappers";

/** 현재 로그인 유저의 프로필. 로그인 안 했으면 null */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (uid == null) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (error) throw error;
  return data ? toProfile(data) : null;
}
