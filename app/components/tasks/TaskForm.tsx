"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_TYPES } from "@/lib/constants/tasks";
import type { Database, TaskStatus, TaskPriority, TaskType } from "@/lib/supabase/types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

interface Props {
  initial?: Partial<TaskRow>;
  taskId?: string;
}

export default function TaskForm({ initial, taskId }: Props) {
  const router = useRouter();
  const isEdit = !!taskId;

  const [title,          setTitle]          = useState(initial?.title          ?? "");
  const [description,    setDescription]    = useState(initial?.description    ?? "");
  const [status,         setStatus]         = useState<TaskStatus>(initial?.status    ?? "todo");
  const [priority,       setPriority]       = useState<TaskPriority>(initial?.priority ?? "medium");
  const [taskType,       setTaskType]       = useState<TaskType>(initial?.task_type    ?? "admin");
  const [dueDate,        setDueDate]        = useState(initial?.due_date       ?? "");
  const [contactId,      setContactId]      = useState(initial?.linked_contact_id ?? "");
  const [dealId,         setDealId]         = useState(initial?.linked_deal_id    ?? "");
  const [projectId,      setProjectId]      = useState(initial?.linked_project_id ?? "");

  // Dropdown options fetched lazily
  const [contacts,  setContacts]  = useState<{ id: string; name: string }[]>([]);
  const [deals,     setDeals]     = useState<{ id: string; title: string }[]>([]);
  const [projects,  setProjects]  = useState<{ id: string; name: string }[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch("/api/contacts?limit=100").then(r => r.json()).then(d => setContacts(Array.isArray(d) ? d : []));
    fetch("/api/deals?limit=100").then(r => r.json()).then(d => setDeals(Array.isArray(d) ? d : []));
    fetch("/api/projects?limit=100").then(r => r.json()).then(d => setProjects(Array.isArray(d) ? d : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");

    const payload = {
      title: title.trim(),
      description:        description || null,
      status,
      priority,
      task_type:          taskType,
      due_date:           dueDate     || null,
      linked_contact_id:  contactId   || null,
      linked_deal_id:     dealId      || null,
      linked_project_id:  projectId   || null,
    };

    const url    = isEdit ? `/api/tasks/${taskId}` : "/api/tasks";
    const method = isEdit ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      setSaving(false);
      return;
    }
    router.push("/tasks");
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <div>
        <label className={labelCls}>Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Task title…" required />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          className={`${inputCls} resize-none`} rows={3} placeholder="Optional details…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select value={taskType} onChange={e => setTaskType(e.target.value as TaskType)} className={inputCls}>
            {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={inputCls}>
            {TASK_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} className={inputCls}>
            {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 mb-3">Link to (optional)</p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelCls}>Contact</label>
            <select value={contactId} onChange={e => setContactId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Deal</label>
            <select value={dealId} onChange={e => setDealId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project</label>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </form>
  );
}
