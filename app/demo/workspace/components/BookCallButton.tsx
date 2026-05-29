"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const BookCallModal = dynamic(() => import("./BookCallModal"), { ssr: false });

interface Props {
  className?: string;
  label?: string;
  sessionName?: string;
  sessionEmail?: string;
  variant?: "primary" | "ghost" | "banner";
  onOpen?: () => void;
}

export default function BookCallButton({
  className,
  label = "Book a call",
  sessionName,
  sessionEmail,
  variant = "primary",
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => { onOpen?.(); setOpen(true); }, [onOpen]);
  const handleClose = useCallback(() => setOpen(false), []);

  const variantClass = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors",
    ghost:   "text-indigo-400 hover:text-indigo-300 font-medium transition-colors underline",
    banner:  "bg-white text-indigo-900 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors",
  }[variant];

  return (
    <>
      <button
        onClick={handleOpen}
        className={className ?? variantClass}
        type="button"
      >
        {label}
      </button>

      {open && (
        <BookCallModal
          onClose={handleClose}
          sessionName={sessionName}
          sessionEmail={sessionEmail}
        />
      )}
    </>
  );
}
