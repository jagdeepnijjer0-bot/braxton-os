import "server-only";
import { getAnthropicClient, HAIKU } from "./client";
import { isMockMode } from "./is-mock";
import { mockScore } from "./mock";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

export type ScoreLabel = "hot" | "warm" | "cold";

export interface LeadScore {
  score:       number;
  label:       ScoreLabel;
  reasoning:   string;
  key_factors: string[];
}

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];

function buildContactContext(c: ContactRow): string {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.name || "Unknown";
  const lines: string[] = [`Name: ${name}`];
  if (c.company)   lines.push(`Company: ${c.company}`);
  if (c.role)      lines.push(`Role: ${c.role}`);
  if (c.lead_type) lines.push(`Lead type: ${c.lead_type}`);
  if (c.source)    lines.push(`Source: ${c.source}`);
  lines.push(`Status: ${c.status}`);
  lines.push(`Has email: ${c.email ? "yes" : "no"}`);
  lines.push(`Has phone: ${c.phone ? "yes" : "no"}`);
  if (c.notes)     lines.push(`Notes: ${c.notes.slice(0, 400)}`);
  if (c.follow_up_date) {
    const days = Math.ceil((new Date(c.follow_up_date).getTime() - Date.now()) / 86400000);
    lines.push(`Follow-up: ${days >= 0 ? `in ${days} days` : `${Math.abs(days)} days overdue`}`);
  }
  const daysSince = c.last_contacted
    ? Math.floor((Date.now() - new Date(c.last_contacted).getTime()) / 86400000)
    : null;
  lines.push(daysSince !== null ? `Last contacted: ${daysSince} days ago` : `Last contacted: never`);
  const age = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
  lines.push(`Lead age: ${age} days`);
  return lines.join("\n");
}

export async function scoreContact(contact: ContactRow): Promise<LeadScore> {
  if (await isMockMode()) return mockScore(contact.id || contact.name || "default");

  const ai = getAnthropicClient();

  const response = await ai.messages.create({
    model: HAIKU,
    max_tokens: 400,
    system: `You are a lead scoring AI for a UK property and SaaS business. Score leads 0-100 using these factors:
- Budget indicators (+25): specific amounts or investment capacity in notes
- Lead source quality (+20): referral=20, investor/landlord/developer lead_type=15, website form=12, cold=5
- Engagement (+20): has both phone+email=10, follow-up scheduled=5, contacted recently=5
- Urgency (+15): urgent keywords in notes, overdue follow-up, time-sensitive project
- Project type fit (+10): investor/developer/landlord=10, letting_agent=8, other=5, unknown=2
- Negative signals (-20): closed_lost/inactive status, stale >90 days with no contact, no contact info

Scoring bands: 70-100=hot, 40-69=warm, 0-39=cold.
IMPORTANT: Respond ONLY with valid JSON, no markdown fences:
{"score":number,"label":"hot"|"warm"|"cold","reasoning":"1-2 sentences","key_factors":["f1","f2","f3"]}`,
    messages: [{ role: "user", content: `Score this lead:\n\n${buildContactContext(contact)}` }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const clean = raw.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(clean);

  return {
    score:       Math.max(0, Math.min(100, Math.round(Number(parsed.score ?? 50)))),
    label:       (["hot", "warm", "cold"].includes(parsed.label) ? parsed.label : "warm") as ScoreLabel,
    reasoning:   String(parsed.reasoning ?? ""),
    key_factors: Array.isArray(parsed.key_factors) ? (parsed.key_factors as string[]).slice(0, 5) : [],
  };
}

export async function scoreAndPersist(contactId: string): Promise<LeadScore> {
  const supabase = createAdminClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  if (error || !contact) throw new Error(`Contact not found: ${contactId}`);

  const score = await scoreContact(contact);

  const { error: updateErr } = await supabase
    .from("contacts")
    .update({
      ai_score:       score.score,
      ai_score_label: score.label,
      ai_scored_at:   new Date().toISOString(),
    })
    .eq("id", contactId);

  if (updateErr) throw new Error(`Failed to persist score: ${updateErr.message}`);

  return score;
}
