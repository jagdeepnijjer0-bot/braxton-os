import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxPlatform } from "@/lib/supabase/types";

// ── Meta webhook payload types ────────────────────────────────────────────────

export interface MetaMessagingEntry {
  sender:    { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid:  string;
    text: string;
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
}

// ── Main processor ────────────────────────────────────────────────────────────

export async function processMetaWebhook(payload: MetaWebhookPayload): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, skipped: 0, errors: [] };
  const supabase = createAdminClient();

  for (const entry of payload.entry) {
    // ── Messaging events (Instagram DMs, Facebook Messenger) ─────────────────
    if (entry.messaging?.length) {
      const platform: InboxPlatform = payload.object === "instagram" ? "instagram" : "facebook";

      for (const msg of entry.messaging) {
        // Skip echo events (messages sent by the page itself)
        if (msg.message?.is_echo) { result.skipped++; continue; }
        if (!msg.message?.text)   { result.skipped++; continue; }

        try {
          await processMessageEvent(supabase, platform, entry.id, msg);
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
          await processLeadgenEvent(supabase, entry.id, change.value);
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
  platform:  InboxPlatform,
  pageId:    string,
  msg:       MetaMessagingEntry,
) {
  const senderId  = msg.sender.id;
  const messageId = msg.message!.mid;
  const text      = msg.message!.text;
  const ts        = new Date(msg.timestamp).toISOString();

  // Deduplicate: skip if we've already stored this exact message
  const { data: existing } = await supabase
    .from("inbox_messages")
    .select("id")
    .eq("external_message_id", messageId)
    .maybeSingle();

  if (existing) return;

  // Find or create CRM contact by Meta sender ID
  // We store the sender ID in the contacts.notes field as a fallback
  // and will match by a dedicated lookup once real API is wired
  let contactId: string | null   = null;
  let contactName: string | null = `${platform === "instagram" ? "Instagram" : "Facebook"} User`;

  const { data: matchedContact } = await supabase
    .from("contacts")
    .select("id, name")
    .ilike("notes", `%meta_sender_id:${senderId}%`)
    .maybeSingle();

  if (matchedContact) {
    contactId   = matchedContact.id;
    contactName = matchedContact.name;
  } else {
    // Create a new CRM contact as a placeholder
    const { data: newContact } = await supabase
      .from("contacts")
      .insert({
        name:      contactName,
        source:    platform,
        status:    "new",
        lead_type: platform === "instagram" ? "website_app_prospect" : "website_app_prospect",
        notes:     `Auto-created from ${platform} message. meta_sender_id:${senderId} page_id:${pageId}`,
      })
      .select("id")
      .single();

    if (newContact) contactId = newContact.id;
  }

  // Find or create conversation (keyed by external_thread_id = sender ID + platform)
  const externalThreadId = `${platform}:${senderId}`;

  const { data: existingConv } = await supabase
    .from("inbox_conversations")
    .select("id, status")
    .eq("external_thread_id", externalThreadId)
    .maybeSingle();

  let conversationId: string;

  if (existingConv) {
    conversationId = existingConv.id;
    // Update latest message
    await supabase
      .from("inbox_conversations")
      .update({
        latest_message:    text.length > 120 ? text.slice(0, 120) + "…" : text,
        latest_message_at: ts,
        is_read:           false,
        status:            existingConv.status === "closed" ? "open" : existingConv.status,
        contact_id:        contactId,
        contact_name:      contactName,
      })
      .eq("id", conversationId);
  } else {
    const { data: newConv } = await supabase
      .from("inbox_conversations")
      .insert({
        platform,
        contact_id:         contactId,
        contact_name:       contactName,
        subject:            `${platform === "instagram" ? "Instagram" : "Facebook"} message from ${contactName}`,
        latest_message:     text.length > 120 ? text.slice(0, 120) + "…" : text,
        latest_message_at:  ts,
        status:             "open",
        priority:           "normal",
        is_read:            false,
        external_thread_id: externalThreadId,
      })
      .select("id")
      .single();

    if (!newConv) throw new Error("Failed to create inbox conversation");
    conversationId = newConv.id;
  }

  // Add message record
  await supabase
    .from("inbox_messages")
    .insert({
      conversation_id:     conversationId,
      direction:           "inbound",
      body:                text,
      sender_name:         contactName,
      is_read:             false,
      external_message_id: messageId,
    });

  // In-app notification
  await supabase.from("notifications").insert({
    title:              `New ${platform === "instagram" ? "Instagram" : "Facebook"} message`,
    body:               `From ${contactName}: ${text.length > 80 ? text.slice(0, 80) + "…" : text}`,
    type:               "system",
    priority:           "high",
    link_url:           `/inbox/${conversationId}`,
    linked_entity_type: "contact",
    linked_entity_id:   contactId ?? undefined,
    source_key:         `meta_msg_${messageId}`,
  });
}

// ── Lead form event handler ───────────────────────────────────────────────────

async function processLeadgenEvent(
  supabase:  ReturnType<typeof createAdminClient>,
  pageId:    string,
  value:     MetaLeadgenEntry["value"],
) {
  // With real Meta API approval, you'd fetch the lead data using the Graph API:
  // GET /<leadgen_id>?fields=field_data&access_token=<PAGE_TOKEN>
  // For MVP: create a placeholder contact and form submission
  const leadId = value.leadgen_id;

  // Deduplicate via source_key in notifications
  const { data: existingNotif } = await supabase
    .from("notifications")
    .select("id")
    .eq("source_key", `meta_lead_${leadId}`)
    .maybeSingle();

  if (existingNotif) return;

  const { data: contact } = await supabase
    .from("contacts")
    .insert({
      name:      "Facebook Lead (pending sync)",
      source:    "facebook",
      status:    "new",
      lead_type: "website_app_prospect",
      notes:     `Facebook Lead Ad submission. leadgen_id:${leadId} form_id:${value.form_id} page_id:${pageId}. Fetch full lead data once Meta API is approved.`,
    })
    .select("id")
    .single();

  await supabase.from("notifications").insert({
    title:              "New Facebook Lead Ad submission",
    body:               `Lead ID: ${leadId} — fetch full data via Meta Graph API to update contact details.`,
    type:               "system",
    priority:           "high",
    link_url:           contact ? `/crm/${contact.id}` : "/crm",
    linked_entity_type: "contact",
    linked_entity_id:   contact?.id ?? undefined,
    source_key:         `meta_lead_${leadId}`,
  });

  await supabase.from("tasks").insert({
    title:             "Review Facebook Lead Ad submission",
    description:       `New lead from Facebook Lead Ad (form_id: ${value.form_id}). Connect Meta API to auto-sync lead fields.`,
    task_type:         "follow_up",
    status:            "todo",
    priority:          "high",
    linked_contact_id: contact?.id ?? null,
  });
}
