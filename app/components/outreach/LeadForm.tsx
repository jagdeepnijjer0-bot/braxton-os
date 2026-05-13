"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PLATFORMS, LEAD_STATUSES, REPLY_STATUSES } from "@/lib/constants/outreach";
import type { Database, OutreachPlatform, LeadStatus, ReplyStatus } from "@/lib/supabase/types";

type LeadRow = Database["public"]["Tables"]["outreach_leads"]["Row"];

interface Props {
  campaignId: string;
  initial?:   Partial<LeadRow>;
  leadId?:    string;
}

export default function LeadForm({ campaignId, initial, leadId }: Props) {
  const router = useRouter();
  const isEdit = !!leadId;

  const [name,        setName]        = useState(initial?.contact_name  ?? "");
  const [company,     setCompany]     = useState(initial?.company       ?? "");
  const [email,       setEmail]       = useState(initial?.email         ?? "");
  const [phone,       setPhone]       = useState(initial?.phone         ?? "");
  const [platform,    setPlatform]    = useState<OutreachPlatform>(initial?.platform     ?? "email");
  const [leadSource,  setLeadSource]  = useState(initial?.lead_source   ?? "");
  const [status,      setStatus]      = useState<LeadStatus>(initial?.status       ?? "new");
  const [replyStatus, setReplyStatus] = useState<ReplyStatus>(initial?.reply_status ?? "no_reply");
  const [step,        setStep]        = useState<number>(initial?.step ?? 1);
  const [bookedCall,  setBookedCall]  = useState(initial?.booked_call   ?? false);
  const [closedDeal,  setClosedDeal]  = useState(initial?.closed_deal   ?? false);
  const [followUp,    setFollowUp]    = useState(initial?.next_follow_up ?? "");
  const [notes,       setNotes]       = useState(initial?.notes          ?? "");
  const [contactId,   setContactId]   = useState(initial?.linked_contact_id ?? "");

  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch("/api/contacts?limit=100").then(r => r.json()).then(d => setContacts(Array.isArray(d) ? d : []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Contact name is required"); return; }
    setSaving(true); setError("");

    const payload = {
      contact_name:      name.trim(),
      company:           company     || null,
      email:             email       || null,
      phone:             phone       || null,
      platform, status, reply_status: replyStatus, step,
      lead_source:       leadSource  || null,
      notes:             notes       || null,
      next_follow_up:    followUp    || null,
      linked_contact_id: contactId   || null,
      booked_call: bookedCall,
      closed_deal: closedDeal,
    };

    const url    = isEdit ? `/api/outreach/leads/${leadId}` : `/api/outreach/campaigns/${campaignId}/leads`;
    const method = isEdit ? "PATCH" : "POST";
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save"); setSaving(false); return; }
    router.push(`/outreach/${campaignId}`);
    router.refresh();
  }

  const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Contact Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Full name" required />
        </div>
        <div>
          <label className={labelCls}>Company</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} className={inputCls} placeholder="Company name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="email@example.com" />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+44..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value as OutreachPlatform)} className={inputCls}>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Lead Source</label>
          <input type="text" value={leadSource} onChange={e => setLeadSource(e.target.value)} className={inputCls} placeholder="e.g. LinkedIn search" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as LeadStatus)} className={inputCls}>
            {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Reply Status</label>
          <select value={replyStatus} onChange={e => setReplyStatus(e.target.value as ReplyStatus)} className={inputCls}>
            {REPLY_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Step #</label>
          <input type="number" min={1} max={20} value={step} onChange={e => setStep(Number(e.target.value))} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Next Follow-Up</label>
        <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)} className={inputCls} />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={bookedCall} onChange={e => setBookedCall(e.target.checked)} className="w-4 h-4 rounded accent-emerald-600" />
          <span className="text-sm font-medium text-gray-700">Booked Call</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={closedDeal} onChange={e => setClosedDeal(e.target.checked)} className="w-4 h-4 rounded accent-green-600" />
          <span className="text-sm font-medium text-gray-700">Closed Deal</span>
        </label>
      </div>

      <div>
        <label className={labelCls}>Link to CRM Contact</label>
        <select value={contactId} onChange={e => setContactId(e.target.value)} className={inputCls}>
          <option value="">— None —</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Notes about this lead…" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Lead"}
        </button>
      </div>
    </form>
  );
}
