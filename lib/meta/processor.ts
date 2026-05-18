import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxPlatform } from "@/lib/supabase/types";

// ── Meta webhook payload types ────────────────────────────────────────────────

export interface MetaMessagingEntry {
  sender:    { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid:      string;
    text:     string;
    is_echo?: boolean;
  };
}

export interface MetaLeadgenEntry {
  field: "leadgen";
  value: {
    form_id:      string;
    leadgen_id:   string;
    page_id:      string;
    created_time: number;
    ad_id?:       string;
  };
}

export interface MetaWebhookPayload {
  object: "instagram" | "page" | string;
  entry: Array<{
    id:        string;
    time:      number;
    messaging?: MetaMessagingEntry[];
    changes?:  MetaLeadgenEntry[];
  }>;
}

export interface ProcessResult {
  processed: number;
  skipped:   number;
  errors:    string[];
  detail:    string[];
}

function supaErr(label: string, err: { message: string; code?: string; details?: string } | null): string {
  if (!err) return `${label}: unknown error`;
  return `${label}: ${[err.message, err.code, err.details].filter(Boolean).join(" | ")}`;
}

// ── Main processor ────────────────────────────────────────────────────────────

export async function processMetaWebhook(payload: MetaWebhookPayload): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, skipped: 0, errors: [], detail: [] };
  const supabase = createAdminClient();

  for (const entry of payload.entry) {
    if (entry.messaging?.length) {
      const platform: InboxPlatform = payload.object === "instagram" ? "instagram" : "facebook";
      for (const msg of entry.messaging) {
        if (msg.message?.is_echo) { result.skipped++; continue; }
        if (!msg.message?.text)   { result.skipped++; continue; }
        try {
          const info = await processMessageEvent(supabase, platform, entry.id, msg);
          result.detail.push(info);
          result.processed++;
        } catch (err) {
          result.errors.push(err instanceof Error ? err.message : String(err));
        }
      }
    }

    if (entry.changes?.length) {
      for (const change of entry.changes) {
        if (change.field !== "leadgen") { result.skipped++; continue; }
        try {
          const info = await processLeadgenEvent(supabase, entry.id, change.value);
          result.detail.push(info);
          result.processed++;
        } catch (err) {
          result.errors.push(err instanceof Error ? err.message : String(err));
        }
      }
    }
  }

  return result;
}

// ── Messaging event handler ───────────────────────────────────────────────────

async function processMessageEvent(
  supabase: ReturnType<typeof createAdminClient>,
  platform: InboxPlatform,
  pageId:   string,
  msg:      MetaMessagingEntry,
): Promise<string> {
  const senderId  = msg.sender.id;
  const messageId = msg.message!.mid;
  const text      = msg.message!.text;
  const ts        = new Date(msg.timestamp).toISOString();
  const snippet   = text.length > 120 ? text.slice(0, 120) + "…" : text;

  // ── 1. Dedup on message ID ────────────────────────────────────────────────
  const { data: dupMsg, error: dupErr } = await supabase
    .from("inbox_messages")
    .select("id")
    .eq("external_message_id", messageId)
    .maybeSingle();
  if (dupErr) throw new Error(supaErr("Message dedup check", dupErr));
  if (dupMsg) return `skipped — message ${messageId} already stored`;

  // ── 2. Find existing conversation (gives us contact_id too) ───────────────
  // We NEVER query contacts.notes — dedup lives on inbox_conversations.external_thread_id
  const externalThreadId = `${platform}:${senderId}`;

  const { data: existingConv, error: convLookupErr } = await supabase
    .from("inbox_conversations")
    .select("id, status, contact_id, contact_name")
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();
  if (convLookupErr) throw new Error(supaErr("Conversation lookup", convLookupErr));

  let contactId:   string | null = existingConv?.contact_id   ?? null;
  let contactName: string        = existingConv?.contact_name
    ?? (platform === "instagram" ? "Instagram User" : "Facebook User");

  // ── 3. Create contact only for new threads ────────────────────────────────
  if (!existingConv) {
    const label = platform === "instagram" ? "Instagram" : "Facebook";
    const { data: newContacts, error: contactErr } = await supabase
      .from("contacts")
      .insert({
        first_name: label,
        last_name:  "User",
        status:     "lead",
      })
      .select("id, first_name, last_name");

    if (contactErr) throw new Error(supaErr("Contact insert", contactErr));
    if (!newContacts?.length) throw new Error("Contact insert returned no rows");

    contactId = newContacts[0].id;
    // Compose display name from whatever the row returned
    const fn = newContacts[0].first_name ?? label;
    const ln = newContacts[0].last_name  ?? "User";
    contactName = `${fn} ${ln}`.trim();
  }

  // ── 4. Create or update conversation ─────────────────────────────────────
  let conversationId: string;

  if (existingConv) {
    conversationId = existingConv.id;
    const { error: updErr } = await supabase
      .from("inbox_conversations")
      .update({
        latest_message:    snippet,
        latest_message_at: ts,
        is_read:           false,
        status:            existingConv.status === "closed" ? "open" : existingConv.status,
        contact_id:        contactId,
        contact_name:      contactName,
      })
      .eq("id", conversationId);
    if (updErr) throw new Error(supaErr("Conversation update", updErr));
  } else {
    const { data: newConvs, error: convErr } = await supabase
      .from("inbox_conversations")
      .insert({
        platform,
        contact_id:         contactId,
        contact_name:       contactName,
        subject:            `${platform === "instagram" ? "Instagram" : "Facebook"} message from ${contactName}`,
        latest_message:     snippet,
        latest_message_at:  ts,
        status:             "open",
        priority:           "normal",
        is_read:            false,
        external_thread_id: externalThreadId,
      })
      .select("id");

    if (convErr)           throw new Error(supaErr("Conversation insert", convErr));
    if (!newConvs?.length) throw new Error("Conversation insert returned no rows");
    conversationId = newConvs[0].id;
  }

  // ── 5. Insert message ─────────────────────────────────────────────────────
  const { error: msgErr } = await supabase
    .from("inbox_messages")
    .insert({
      conversation_id:     conversationId,
      direction:           "inbound",
      body:                text,
      sender_name:         contactName,
      is_read:             false,
      external_message_id: messageId,
    });
  if (msgErr) throw new Error(supaErr("Message insert", msgErr));

  // ── 6. Notification (best-effort) ─────────────────────────────────────────
  const { error: notifErr } = await supabase.from("notifications").insert({
    title:              `New ${platform === "instagram" ? "Instagram" : "Facebook"} message`,
    body:               `From ${contactName}: ${text.length > 80 ? text.slice(0, 80) + "…" : text}`,
    type:               "system",
    priority:           "high",
    link_url:           `/inbox/${conversationId}`,
    linked_entity_type: "contact",
    linked_entity_id:   contactId ?? undefined,
    source_key:         `meta_msg_${messageId}`,
  });
  const notifNote = notifErr ? ` (notification warning: ${notifErr.message})` : "";

  return `${platform} processed — contact ${contactId}, conversation ${conversationId}${notifNote}`;
}

// ── Lead form event handler ───────────────────────────────────────────────────

async function processLeadgenEvent(
  supabase: ReturnType<typeof createAdminClient>,
  pageId:   string,
  value:    MetaLeadgenEntry["value"],
): Promise<string> {
  const leadId = value.leadgen_id;
  const formId = value.form_id;
  const externalThreadId = `facebook_lead:${leadId}`;

  // ── 1. Dedup via conversation external_thread_id (no contacts.notes query) ─
  const { data: dupConv, error: dupErr } = await supabase
    .from("inbox_conversations")
    .select("id, contact_id")
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();
  if (dupErr) throw new Error(supaErr("Lead dedup check", dupErr));
  if (dupConv) return `skipped — lead ${leadId} already processed (conversation ${dupConv.id})`;

  // ── 2. Create CRM contact ─────────────────────────────────────────────────
  const { data: newContacts, error: contactErr } = await supabase
    .from("contacts")
    .insert({
      first_name: "Facebook",
      last_name:  "Lead",
      status:     "lead",
    })
    .select("id");

  if (contactErr)           throw new Error(supaErr("Lead contact insert", contactErr));
  if (!newContacts?.length) throw new Error("Lead contact insert returned no rows");
  const contactId = newContacts[0].id;

  // ── 3. Create inbox conversation ──────────────────────────────────────────
  const { data: newConvs, error: convErr } = await supabase
    .from("inbox_conversations")
    .insert({
      platform:           "facebook",
      contact_id:         contactId,
      contact_name:       "Facebook Lead",
      subject:            `Facebook Lead Ad — form ${formId}`,
      latest_message:     `Lead Ad submission received. Leadgen ID: ${leadId}. Connect Meta API to fetch full lead fields.`,
      latest_message_at:  new Date(value.created_time * 1000).toISOString(),
      status:             "open",
      priority:           "high",
      is_read:            false,
      external_thread_id: externalThreadId,
    })
    .select("id");

  if (convErr) throw new Error(supaErr("Lead conversation insert", convErr));
  const conversationId = newConvs?.[0]?.id ?? null;

  // ── 4. Notification (best-effort) ─────────────────────────────────────────
  await supabase.from("notifications").insert({
    title:              "New Facebook Lead Ad submission",
    body:               `Lead ID: ${leadId} — connect Meta API to fetch full lead data.`,
    type:               "system",
    priority:           "high",
    link_url:           `/crm/${contactId}`,
    linked_entity_type: "contact",
    linked_entity_id:   contactId,
    source_key:         `meta_lead_${leadId}`,
  });

  // ── 5. Follow-up task (best-effort) ───────────────────────────────────────
  await supabase.from("tasks").insert({
    title:             "Review Facebook Lead Ad submission",
    description:       `Facebook Lead Ad received.\nForm ID: ${formId}\nLead ID: ${leadId}\nPage ID: ${pageId}\n\nConnect Meta Graph API to fetch full lead field data.`,
    task_type:         "follow_up",
    status:            "todo",
    priority:          "high",
    linked_contact_id: contactId,
  });

  const convNote = conversationId ? `, conversation ${conversationId}` : "";
  return `Facebook lead processed — contact ${contactId}${convNote}`;
}
