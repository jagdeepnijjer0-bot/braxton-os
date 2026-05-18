"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormStatus } from "@/lib/supabase/types";

const STATUSES: FormStatus[] = ["new", "reviewed", "contacted", "qualified", "closed"];

interface Props {
  id:            string;
  currentStatus: FormStatus;
  statusColors:  Record<FormStatus, string>;
}

export default function SubmissionStatusUpdate({ id, currentStatus, statusColors }: Props) {
  const router   = useRouter();
  const [status, setStatus] = useState<FormStatus>(currentStatus);
  const [saving, setSaving] = useState(false);

  async function change(next: FormStatus) {
    if (next === status) return;
    setSaving(true);
    try {
      await fetch(`/api/forms/submissions/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      });
      setStatus(next);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => change(e.target.value as FormStatus)}
      disabled={saving}
      className={`text-xs border rounded-full px-2 py-1 font-medium bg-transparent cursor-pointer focus:outline-none ${statusColors[status]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-gray-900 text-white capitalize">{s}</option>
      ))}
    </select>
  );
}
