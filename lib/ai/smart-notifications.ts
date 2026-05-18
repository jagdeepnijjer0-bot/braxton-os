import "server-only";
import { getAnthropicClient, HAIKU } from "./client";
import { isMockMode } from "./is-mock";
import { mockSentiment } from "./mock";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SmartNotifyResult {
  created: number;
  skipped: number;
  details: string[];
}

interface NotifPayload {
  title:               string;
  body:                string;
  type:                string;
  priority:            string;
  link_url?:           string;
  linked_entity_type?: string;
  linked_entity_id?:   string;
  source_key:          string;
}

export async function runSmartNotificationSweep(): Promise<SmartNotifyResult> {
  const supabase = createAdminClient();
  const result: SmartNotifyResult = { created: 0, skipped: 0, details: [] };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  async function tryInsert(p: NotifPayload): Promise<boolean> {
    const { data: exists } = await supabase
      .from("notifications")
      .select("id")
      .eq("source_key", p.source_key)
      .maybeSingle();
    if (exists) { result.skipped++; return false; }

    // NotificationType / NotificationPriority from types are strict enums; our strings match them
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("notifications").insert(p as any);
    result.created++;
    return true;
  }

  // ── 1. Overdue follow-ups ─────────────────────────────────────────────────
  const { data: overdueFollowUps } = await supabase
    .from("contacts")
    .select("id, name, first_name, last_name, follow_up_date")
    .lt("follow_up_date", todayIso)
    .not("follow_up_date", "is", null)
    .not("status", "in", "(closed_won,closed_lost,inactive)");

  for (const c of overdueFollowUps ?? []) {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.name || "Contact";
    const dateStr = new Date(c.follow_up_date!).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const created = await tryInsert({
      title:              "Overdue follow-up",
      body:               `${name} had a follow-up due ${dateStr} — take action now.`,
      type:               "follow_up_overdue",
      priority:           "high",
      link_url:           `/crm/${c.id}`,
      linked_entity_type: "contact",
      linked_entity_id:   c.id,
      source_key:         `overdue_followup_${c.id}_${c.follow_up_date!.slice(0, 10)}`,
    });
    if (created) result.details.push(`Overdue follow-up: ${name}`);
  }

  // ── 2. Hot leads going cold (no contact in 3+ days) ───────────────────────
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: hotLeads } = await supabase
    .from("contacts")
    .select("id, name, first_name, last_name, ai_score_label, last_contacted, created_at")
    .eq("ai_score_label", "hot")
    .or(`last_contacted.lt.${threeDaysAgo},last_contacted.is.null`)
    .not("status", "in", "(closed_won,closed_lost,inactive)");

  const todayKey = new Date().toISOString().slice(0, 10);
  for (const c of hotLeads ?? []) {
    const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || c.name || "Contact";
    const days = c.last_contacted
      ? Math.floor((Date.now() - new Date(c.last_contacted).getTime()) / 86400000)
      : Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
    const created = await tryInsert({
      title:              "Hot lead going cold",
      body:               `${name} is a hot lead with no contact in ${days} day${days !== 1 ? "s" : ""}. Reach out now.`,
      type:               "follow_up_overdue",
      priority:           "urgent",
      link_url:           `/crm/${c.id}`,
      linked_entity_type: "contact",
      linked_entity_id:   c.id,
      source_key:         `hot_no_reply_${c.id}_${todayKey}`,
    });
    if (created) result.details.push(`Hot lead silent: ${name} (${days}d)`);
  }

  // ── 3. Overdue tasks ──────────────────────────────────────────────────────
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, title, linked_contact_id, due_date")
    .lt("due_date", todayIso)
    .not("due_date", "is", null)
    .in("status", ["todo", "in_progress"]);

  for (const t of overdueTasks ?? []) {
    const dateStr = new Date(t.due_date!).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const created = await tryInsert({
      title:              "Overdue task",
      body:               `"${t.title}" was due ${dateStr} and has not been completed.`,
      type:               "task_overdue",
      priority:           "high",
      link_url:           t.linked_contact_id ? `/crm/${t.linked_contact_id}` : "/tasks",
      linked_entity_type: "task",
      linked_entity_id:   t.id,
      source_key:         `task_overdue_${t.id}_${t.due_date!.slice(0, 10)}`,
    });
    if (created) result.details.push(`Overdue task: ${t.title}`);
  }

  return result;
}

// ── Negative sentiment detection ─────────────────────────────────────────────

export interface SentimentResult {
  negative: boolean;
  score:    number;   // 0 = very negative, 100 = very positive
  reason:   string;
}

export async function detectNegativeSentiment(conversationId: string): Promise<SentimentResult> {
  if (await isMockMode()) return mockSentiment(conversationId);

  const supabase = createAdminClient();
  const ai = getAnthropicClient();

  const { data: messages } = await supabase
    .from("inbox_messages")
    .select("direction, body")
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!messages?.length) return { negative: false, score: 50, reason: "No messages to analyse" };

  const text = messages.map(m => m.body).join("\n---\n");

  const response = await ai.messages.create({
    model: HAIKU,
    max_tokens: 150,
    messages: [{
      role: "user",
      content: `Analyse the sentiment of these inbound messages. Respond ONLY with valid JSON, no markdown:
{"negative":boolean,"score":number,"reason":"brief reason"}
score: 0=very negative, 100=very positive

Messages:
${text.slice(0, 600)}`,
    }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
  const clean = raw.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  try {
    const parsed = JSON.parse(clean) as { negative?: unknown; score?: unknown; reason?: unknown };
    return {
      negative: Boolean(parsed.negative),
      score:    typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 50,
      reason:   typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return { negative: false, score: 50, reason: "Parse error" };
  }
}
