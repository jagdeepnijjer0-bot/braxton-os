import "server-only";
import { getAnthropicClient, SONNET } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function summarizeContact(contactId: string): Promise<string> {
  const supabase = createAdminClient();
  const ai = getAnthropicClient();

  const [{ data: contact }, { data: activities }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", contactId).single(),
    supabase.from("contact_activities")
      .select("type, body, created_at")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!contact) throw new Error("Contact not found");

  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() || contact.name || "this contact";
  const activityText = activities?.length
    ? activities.map(a => `- ${a.type}: ${a.body}`).join("\n")
    : "No recent activity.";

  const response = await ai.messages.create({
    model: SONNET,
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `Summarise this CRM contact in 1-2 short sentences. Be specific and business-focused. No labels or headings.

Contact:
Name: ${name}
Company: ${contact.company ?? "—"}
Role: ${contact.role ?? "—"}
Lead type: ${contact.lead_type ?? "—"}
Source: ${contact.source ?? "—"}
Status: ${contact.status}
Notes: ${contact.notes?.slice(0, 300) ?? "—"}
Has email: ${contact.email ? "yes" : "no"}  Has phone: ${contact.phone ? "yes" : "no"}

Recent activity:
${activityText}

Example output: "Investor looking for BRR deals in Coventry with £250k budget. Referred by James — high intent, follow-up overdue."`,
    }],
  });

  const summary = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  await supabase.from("contacts").update({ ai_summary: summary }).eq("id", contactId);
  return summary;
}

export async function summarizeConversation(conversationId: string): Promise<string> {
  const supabase = createAdminClient();
  const ai = getAnthropicClient();

  const [{ data: conv }, { data: messages }] = await Promise.all([
    supabase.from("inbox_conversations").select("*").eq("id", conversationId).single(),
    supabase.from("inbox_messages")
      .select("direction, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  if (!conv) throw new Error("Conversation not found");

  const msgText = messages
    ?.map(m => `${m.direction === "inbound" ? "Contact" : "Us"}: ${m.body}`)
    .join("\n") ?? "No messages yet.";

  const response = await ai.messages.create({
    model: SONNET,
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `Summarise this ${conv.platform} conversation in 1-2 sentences. Be specific about intent, urgency, and sentiment. No labels.

Platform: ${conv.platform}
Contact: ${conv.contact_name ?? "Unknown"}
Subject: ${conv.subject ?? "—"}
Status: ${conv.status}

Messages:
${msgText.slice(0, 1200)}

Example: "High urgency AI automation enquiry from a Coventry developer — requested pricing and timeline, positive tone."`,
    }],
  });

  const summary = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  await supabase.from("inbox_conversations").update({ ai_summary: summary }).eq("id", conversationId);
  return summary;
}

export async function summarizeFormSubmission(submissionId: string): Promise<string> {
  const supabase = createAdminClient();
  const ai = getAnthropicClient();

  const { data: sub } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (!sub) throw new Error("Submission not found");

  const response = await ai.messages.create({
    model: SONNET,
    max_tokens: 120,
    messages: [{
      role: "user",
      content: `Summarise this website form submission in 1-2 sentences. Be specific about the lead's needs and urgency. No labels.

Form type: ${sub.form_type}
Submission data: ${JSON.stringify(sub.data, null, 2).slice(0, 800)}
Status: ${sub.status}
Notes: ${sub.notes ?? "—"}

Example: "Landlord with 3 properties in Birmingham seeking full management — urgent need, provided contact details."`,
    }],
  });

  const summary = response.content[0].type === "text" ? response.content[0].text.trim() : "";

  await supabase.from("form_submissions").update({ ai_summary: summary }).eq("id", submissionId);
  return summary;
}
