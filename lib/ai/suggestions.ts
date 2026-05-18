import "server-only";
import { getAnthropicClient, HAIKU } from "./client";
import { isMockMode } from "./is-mock";
import { mockSuggestions } from "./mock";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TaskType, TaskPriority } from "@/lib/supabase/types";

export interface TaskSuggestion {
  title:       string;
  description: string;
  task_type:   TaskType;
  priority:    TaskPriority;
  reason:      string;
}

export async function suggestTasks(contactId: string): Promise<TaskSuggestion[]> {
  if (await isMockMode()) return mockSuggestions(contactId);

  const supabase = createAdminClient();
  const ai = getAnthropicClient();

  const [{ data: contact }, { data: tasks }, { data: activities }] = await Promise.all([
    supabase.from("contacts").select("*").eq("id", contactId).single(),
    supabase.from("tasks")
      .select("title, status, task_type")
      .eq("linked_contact_id", contactId)
      .in("status", ["todo", "in_progress"]),
    supabase.from("contact_activities")
      .select("type, body, created_at")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!contact) throw new Error("Contact not found");

  const name         = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim() || contact.name || "this contact";
  const existingTasks = tasks?.map(t => t.title).join(", ") || "none";
  const recentAct    = activities?.map(a => `${a.type}: ${a.body}`).join("; ") || "none";
  const daysSince    = contact.last_contacted
    ? Math.floor((Date.now() - new Date(contact.last_contacted).getTime()) / 86400000)
    : null;

  const response = await ai.messages.create({
    model: HAIKU,
    max_tokens: 700,
    messages: [{
      role: "user",
      content: `Suggest 2-3 next best actions for this CRM contact. Return ONLY a valid JSON array, no markdown.

Contact:
Name: ${name}
Lead type: ${contact.lead_type ?? "unknown"}
Status: ${contact.status}
AI score: ${contact.ai_score ?? "not scored"} (${contact.ai_score_label ?? "—"})
Days since last contact: ${daysSince ?? "never contacted"}
Follow-up date: ${contact.follow_up_date ?? "not set"}
Open tasks: ${existingTasks}
Recent activity: ${recentAct}

Return a JSON array where each item has:
{"title":string,"description":string,"task_type":"call"|"follow_up"|"meeting"|"outreach"|"admin","priority":"low"|"medium"|"high"|"urgent","reason":string}

Example:
[{"title":"Book discovery call","description":"Schedule 30-min call to understand requirements and budget.","task_type":"call","priority":"high","reason":"Hot lead not contacted in 5 days"}]`,
    }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
  const clean = raw.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]) as TaskSuggestion[];
    return parsed.slice(0, 3);
  } catch {
    return [];
  }
}

export async function createTaskFromSuggestion(
  contactId: string,
  suggestion: TaskSuggestion,
): Promise<string> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title:             suggestion.title,
      description:       suggestion.description,
      task_type:         suggestion.task_type,
      priority:          suggestion.priority,
      status:            "todo",
      linked_contact_id: contactId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  return data.id;
}
