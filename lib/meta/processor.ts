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

// ── Helper: assert a Supabase response or throw with the error message ────────
function assertOk<T>(
  result: { data: T | null; error: { message: string; code?: string; details?: string } | null },
  label:  string,
): T {
  if (result.error) {
    const detail = [result.error.message, result.error.details, result.error.code]
      .filter(Boolean).join(" | ");
    throw new Error(`${label}: ${detail}`);
  }
  if (result.data === null) {
    throw new Error(`${label}: query returned null (no row returned)`);
  }
  return result.data;
}

// ── Main processor ────────────────────────────────────────────────────────────

export async function processMetaWebhook(payload: MetaWebhookPayload): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, skipped: 0, errors: [], detail: [] };
  const supabase = createAdminClient();

  for (const entry of payload.entry) {
    // ── Messaging events (Instagram DMs, Facebook Messenger) ─────────────────
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

    // ── Lead form events (Facebook Lead Ads) ─────────────────────────────────
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

  // ── 1. Deduplicate: skip if this exact message is already stored ─────────
  const dupCheck = await supabase
    .from("inbox_messages")
    .select("id")
    .eq("external_message_id", messageId)
    .maybeSingle();
  if (dupCheck.error) throw new Error(`Dedup check failed: ${dupCheck.error.message}`);
  if (dupCheck.data) return `skipped — message ${messageId} already exists`;

  // ── 2. Find or create CRM contact ────────────────────────────────────────
  let contactId:   string | null = null;
  let contactName: string        = platform === "instagram" ? "Instagram User" : "Facebook User";

  const matchResult = await supabase
    .from("contacts")
    .select("id, name")
    .ilike("notes", `%meta_sender_id:${senderId}%`)
    .maybeSingle();

  if (matchResult.error) throw new Error(`Contact lookup failed: ${matchResult.error.message}`);

  if (matchResult.data) {
    contactId   = matchResult.data.id;
    contactName = matchResult.data.name;
  } else {
    // No existing contact — create one
    const insertResult = await supabase
      .from("contacts")
      .insert({
        name:      contactName,
        source:    platform,
        status:    "new",
        lead_type: "website_app_prospect",
        notes:     `Auto-created from ${platform} message.\nmeta_sender_id:${senderId}\npage_id:${pageId}`,
      })
      .select("id, name");

    if (insertResult.error) {
      throw new Error(`Contact insert failed: ${insertResult.error.message} (code: ${insertResult.error.code ?? "none"}, details: ${insertResult.error.details ?? "none"})`);
    }
    if (!insertResult.data?.length) {
      throw new Error("Contact insert returned no rows — check RLS policies and schema constraints");
    }
    contactId   = insertResult.data[0].id;
    contactName = insertResult.data[0].name;
  }

  // ── 3. Find or create conversation ───────────────────────────────────────
  const externalThreadId = `${platform}:${senderId}`;

  const convLookup = await supabase
    .from("inbox_conversations")
    .select("id, status")
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();

  if (convLookup.error) throw new Error(`Conversation lookup failed: ${convLookup.error.message}`);

  let conversationId: string;
  const snippet = text.length > 120 ? text.slice(0, 120) + "…" : text;

  if (convLookup.data) {
    conversationId = convLookup.data.id;
    const upd = await supabase
      .from("inbox_conversations")
      .update({
        latest_message:    snippet,
        latest_message_at: ts,
        is_read:           false,
        status:            convLookup.data.status === "closed" ? "open" : convLookup.data.status,
        contact_id:        contactId,
        contact_name:      contactName,
      })
      .eq("id", conversationId);
    if (upd.error) throw new Error(`Conversation update failed: ${upd.error.message}`);
  } else {
    const convInsert = await supabase
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

    if (convInsert.error) throw new Error(`Conversation insert failed: ${convInsert.error.message}`);
    if (!convInsert.data?.length) throw new Error("Conversation insert returned no rows");
    conversationId = convInsert.data[0].id;
  }

  // ── 4. Insert message ─────────────────────────────────────────────────────
  const msgInsert = await supabase
    .from("inbox_messages")
    .insert({
      conversation_id:     conversationId,
      direction:           "inbound",
      body:                text,
      sender_name:         contactName,
      is_read:             false,
      external_message_id: messageId,
    });
  if (msgInsert.error) throw new Error(`Message insert failed: ${msgInsert.error.message}`);

  // ── 5. Notification (best-effort — don't fail the main flow) ─────────────
  const notifInsert = await supabase.from("notifications").insert({
    title:              `New ${platform === "instagram" ? "Instagram" : "Facebook"} message`,
    body:               `From ${contactName}: ${text.length > 80 ? text.slice(0, 80) + "…" : text}`,
    type:               "system",
    priority:           "high",
    link_url:           `/inbox/${conversationId}`,
    linked_entity_type: "contact",
    linked_entity_id:   contactId,
    source_key:         `meta_msg_${messageId}`,
  });
  // Non-fatal: log but don't throw
  const notifNote = notifInsert.error ? ` (notification warning: ${notifInsert.error.message})` : "";

  return `${platform} message processed — contact ${contactId}, conversation ${conversationId}${notifNote}`;
}

// ── Lead form event handler ───────────────────────────────────────────────────

async function processLeadgenEvent(
  supabase: ReturnType<typeof createAdminClient>,
  pageId:   string,
  value:    MetaLeadgenEntry["value"],
): Promise<string> {
  const leadId = value.leadgen_id;
  const formId = value.form_id;

  // ── 1. Deduplicate: check for existing contact with this leadgen_id ───────
  const dupCheck = await supabase
    .from("contacts")
    .select("id")
    .ilike("notes", `%leadgen_id:${leadId}%`)
    .maybeSingle();
  if (dupCheck.error) throw new Error(`Lead dedup check failed: ${dupCheck.error.message}`);
  if (dupCheck.data) return `skipped — lead ${leadId} already processed (contact ${dupCheck.data.id})`;

  // ── 2. Create CRM contact ─────────────────────────────────────────────────
  const contactInsert = await supabase
    .from("contacts")
    .insert({
      name:      "Facebook Lead (pending data sync)",
      source:    "facebook",
      status:    "new",
      lead_type: "website_app_prospect",
      notes:     `Facebook Lead Ad submission.\nleadgen_id:${leadId}\nform_id:${formId}\npage_id:${pageId}\n\nFetch full lead fields via Meta Graph API once approved.`,
    })
    .select("id");

  if (contactInsert.error) {
    throw new Error(`Lead contact insert failed: ${contactInsert.error.message} (code: ${contactInsert.error.code ?? "none"}, details: ${contactInsert.error.details ?? "none"})`);
  }
  if (!contactInsert.data?.length) {
    throw new Error("Lead contact insert returned no rows — check RLS and schema constraints");
  }
  const contactId = contactInsert.data[0].id;

  // ── 3. Create inbox conversation ──────────────────────────────────────────
  const convInsert = await supabase
    .from("inbox_conversations")
    .insert({
      platform:           "facebook",
      contact_id:         contactId,
      contact_name:       "Facebook Lead (pending data sync)",
      subject:            `Facebook Lead Ad — form ${formId}`,
      latest_message:     `Lead Ad submission received. Leadgen ID: ${leadId}. Fetch full data once Meta API is approved.`,
      latest_message_at:  new Date(value.created_time * 1000).toISOString(),
      status:             "open",
      priority:           "high",
      is_read:            false,
      external_thread_id: `facebook_lead:${leadId}`,
    })
    .select("id");

  const conversationId = !convInsert.error && convInsert.data?.length
    ? convInsert.data[0].id
    : null;

  // ── 4. Notification (best-effort) ─────────────────────────────────────────
  await supabase.from("notifications").insert({
    title:              "New Facebook Lead Ad submission",
    body:               `Lead ID: ${leadId} — open the contact to fetch full data via Meta Graph API.`,
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
    description:       `New lead from Facebook Lead Ad.\nForm ID: ${formId}\nLead ID: ${leadId}\n\nOnce Meta API is connected, fetch full lead data.`,
    task_type:         "follow_up",
    status:            "todo",
    priority:          "high",
    linked_contact_id: contactId,
  });

  const convNote = conversationId ? `, conversation ${conversationId}` : ` (conversation skipped: ${convInsert.error?.message})`;
  return `Facebook lead processed — contact ${contactId}${convNote}`;
}
