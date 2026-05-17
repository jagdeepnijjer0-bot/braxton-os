"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardRefresh() {
  const router   = useRouter();
  const [spin, setSpin] = useState(false);

  function refresh() {
    setSpin(true);
    router.refresh();
    setTimeout(() => setSpin(false), 1000);
  }

  return (
    <button
      onClick={refresh}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={spin ? "animate-spin" : ""}
      >
        <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
      Refresh
    </button>
  );
}
