import type { TransactionType, PaymentStatus, PaymentMethod, RecurringInterval } from "@/lib/supabase/types";

// ── Categories ────────────────────────────────────────────────

export const INCOME_CATEGORIES: { value: string; label: string; color: string; bg: string }[] = [
  { value: "client_payment",  label: "Client Payment",  color: "text-emerald-700", bg: "bg-emerald-100" },
  { value: "deal_profit",     label: "Deal Profit",     color: "text-green-700",   bg: "bg-green-100"   },
  { value: "rental_income",   label: "Rental Income",   color: "text-teal-700",    bg: "bg-teal-100"    },
  { value: "refund",          label: "Refund",          color: "text-blue-700",    bg: "bg-blue-100"    },
  { value: "other_income",    label: "Other Income",    color: "text-cyan-700",    bg: "bg-cyan-100"    },
];

export const EXPENSE_CATEGORIES: { value: string; label: string; color: string; bg: string }[] = [
  { value: "project_costs",        label: "Project Costs",       color: "text-orange-700", bg: "bg-orange-100"  },
  { value: "contractor_payment",   label: "Contractor Payment",  color: "text-red-700",    bg: "bg-red-100"     },
  { value: "staff_payment",        label: "Staff Payment",       color: "text-rose-700",   bg: "bg-rose-100"    },
  { value: "materials",            label: "Materials",           color: "text-amber-700",  bg: "bg-amber-100"   },
  { value: "software_subscription",label: "Software / SaaS",    color: "text-violet-700", bg: "bg-violet-100"  },
  { value: "ad_spend",             label: "Ad Spend",            color: "text-pink-700",   bg: "bg-pink-100"    },
  { value: "fuel_travel",          label: "Fuel / Travel",       color: "text-yellow-700", bg: "bg-yellow-100"  },
  { value: "office_supplies",      label: "Office Supplies",     color: "text-slate-700",  bg: "bg-slate-100"   },
  { value: "professional_fees",    label: "Professional Fees",   color: "text-indigo-700", bg: "bg-indigo-100"  },
  { value: "insurance",            label: "Insurance",           color: "text-sky-700",    bg: "bg-sky-100"     },
  { value: "utilities",            label: "Utilities",           color: "text-gray-700",   bg: "bg-gray-100"    },
  { value: "recurring_expense",    label: "Recurring Expense",   color: "text-purple-700", bg: "bg-purple-100"  },
  { value: "other_expense",        label: "Other Expense",       color: "text-gray-600",   bg: "bg-gray-100"    },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

// ── Payment status ────────────────────────────────────────────

export const PAYMENT_STATUSES: { value: PaymentStatus; label: string; color: string; bg: string; dot: string }[] = [
  { value: "paid",      label: "Paid",      color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  { value: "pending",   label: "Pending",   color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500"   },
  { value: "overdue",   label: "Overdue",   color: "text-red-700",     bg: "bg-red-100",     dot: "bg-red-500"     },
  { value: "cancelled", label: "Cancelled", color: "text-gray-500",    bg: "bg-gray-100",    dot: "bg-gray-400"    },
];

// ── Payment methods ───────────────────────────────────────────

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "bacs",          label: "BACS"          },
  { value: "card",          label: "Card"           },
  { value: "cash",          label: "Cash"           },
  { value: "cheque",        label: "Cheque"         },
  { value: "stripe",        label: "Stripe"         },
  { value: "paypal",        label: "PayPal"         },
];

// ── Recurring intervals ───────────────────────────────────────

export const RECURRING_INTERVALS: { value: RecurringInterval; label: string }[] = [
  { value: "weekly",    label: "Weekly"    },
  { value: "monthly",   label: "Monthly"   },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly",    label: "Yearly"    },
];

// ── Helpers ───────────────────────────────────────────────────

export function getCategory(value: string | null) {
  return ALL_CATEGORIES.find(c => c.value === value) ?? { value: value ?? "", label: value ?? "—", color: "text-gray-600", bg: "bg-gray-100" };
}

export function getPaymentStatus(value: string | null) {
  return PAYMENT_STATUSES.find(s => s.value === value) ?? PAYMENT_STATUSES[0];
}

export function getPaymentMethod(value: string | null) {
  return PAYMENT_METHODS.find(m => m.value === value)?.label ?? value ?? "—";
}

export function categoriesForType(type: TransactionType) {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function monthLabel(ym: string): string {
  // ym = "2025-11"
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

// Last N months as "YYYY-MM" strings (newest first)
export function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}
