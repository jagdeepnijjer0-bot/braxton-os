"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Props {
  title:       string;
  description: string;
  formType:    string;
  children:    ReactNode;
  /** Extra key/value pairs from child forms that aren't in standard inputs */
  extraData?:  Record<string, unknown>;
}

export default function FormWrapper({ title, description, formType, children, extraData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { form_type: formType };
    formData.forEach((v, k) => { if (v !== "") payload[k] = v; });
    if (extraData) Object.assign(payload, extraData);

    console.log("[FormWrapper] Submitting form_type:", formType);
    console.log("[FormWrapper] Payload:", JSON.stringify(payload));
    console.log("[FormWrapper] POSTing to: /api/forms/submit");

    try {
      const res = await fetch("/api/forms/submit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const json = await res.json() as { error?: string; success?: boolean; submission_id?: string; contact_id?: string; webhook_ok?: boolean };
      console.log("[FormWrapper] Response status:", res.status, "body:", JSON.stringify(json));

      if (!res.ok) {
        console.error("[FormWrapper] Submission error:", json.error);
        throw new Error(json.error ?? "Submission failed");
      }

      if (json.webhook_ok === false) {
        console.warn("[FormWrapper] Form saved but n8n webhook did not return 200. Check Vercel logs and /admin/webhooks.");
      } else {
        console.log("[FormWrapper] n8n webhook confirmed OK");
      }

      router.push(`/forms/success?type=${formType}`);
    } catch (err) {
      console.error("[FormWrapper] catch:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
      <p className="text-gray-400 text-sm mb-8">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {children}

        {error && (
          <div className="rounded-lg bg-red-900/40 border border-red-700 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "Submitting…" : "Submit Enquiry"}
        </button>
      </form>
    </div>
  );
}
