import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
export { scoreLabel, SCORE_HIGH_THRESHOLD } from "./utils";

export const DEMO_COOKIE = "braxton_demo_token";
const DEMO_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

export interface DemoSession {
  id: string;
  token: string;
  contact_id: string | null;
  email: string;
  name: string;
  business_name: string | null;
  industry: string | null;
  problem: string | null;
  bottleneck: string | null;
  engagement_score: number;
  last_active_at: string;
  expires_at: string;
  package_reserved: string | null;
  created_at: string;
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createDemoSession(input: {
  name: string;
  email: string;
  business_name?: string;
  industry?: string;
  problem?: string;
  bottleneck?: string;
  contact_id?: string | null;
}): Promise<DemoSession | null> {
  const admin = createAdminClient();
  const token = generateToken();
  const expires_at = new Date(Date.now() + DEMO_TTL_MS).toISOString();

  const insertPayload = {
    token,
    email:         input.email,
    name:          input.name,
    business_name: input.business_name ?? null,
    industry:      input.industry ?? null,
    problem:       input.problem ?? null,
    bottleneck:    input.bottleneck ?? null,
    contact_id:    input.contact_id ?? null,
    expires_at,
  };

  const { data, error } = await admin
    .from("demo_sessions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(insertPayload as any)
    .select()
    .single();

  if (error || !data) return null;
  return data as unknown as DemoSession;
}

export async function validateDemoSession(token: string): Promise<DemoSession | null> {
  if (!token) return null;
  const admin = createAdminClient();

  const { data } = await admin
    .from("demo_sessions")
    .select("*")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!data) return null;
  return data as unknown as DemoSession;
}

export async function getDemoSessionFromCookie(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_COOKIE)?.value;
  if (!token) return null;
  return validateDemoSession(token);
}

export async function updateEngagementScore(sessionId: string, delta: number): Promise<void> {
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("demo_sessions")
    .select("engagement_score")
    .eq("id", sessionId)
    .single();

  const currentScore = current?.engagement_score ?? 0;
  const newScore = Math.max(0, currentScore + delta);

  await admin
    .from("demo_sessions")
    .update({ engagement_score: newScore, last_active_at: new Date().toISOString() })
    .eq("id", sessionId);
}

