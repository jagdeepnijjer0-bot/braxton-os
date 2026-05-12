import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { lastNMonths } from "@/lib/constants/finance";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const months = Number(searchParams.get("months") ?? "6");

  // Fetch all transactions in the last N months + current
  const monthList = lastNMonths(months);
  const from = monthList[0] + "-01";

  const { data, error } = await supabase
    .from("finance_transactions")
    .select("transaction_date, transaction_type, total_amount, payment_status, is_recurring, category")
    .gte("transaction_date", from);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // All-time totals
  const { data: allData } = await supabase
    .from("finance_transactions")
    .select("transaction_type, total_amount, payment_status");

  const allRows = allData ?? [];

  const totalIncome   = allRows.filter(r => r.transaction_type === "income" && r.payment_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0);
  const totalExpenses = allRows.filter(r => r.transaction_type === "expense" && r.payment_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0);
  const pendingIn     = allRows.filter(r => r.transaction_type === "income" && r.payment_status === "pending").reduce((s, r) => s + Number(r.total_amount), 0);
  const overdueIn     = allRows.filter(r => r.transaction_type === "income" && r.payment_status === "overdue").reduce((s, r) => s + Number(r.total_amount), 0);
  const pendingOut    = allRows.filter(r => r.transaction_type === "expense" && r.payment_status === "pending").reduce((s, r) => s + Number(r.total_amount), 0);

  // Monthly breakdown
  const monthly = monthList.map(ym => {
    const [y, m] = ym.split("-").map(Number);
    const monthRows = rows.filter(r => {
      const d = new Date(r.transaction_date);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
    const income   = monthRows.filter(r => r.transaction_type === "income" && r.payment_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0);
    const expenses = monthRows.filter(r => r.transaction_type === "expense" && r.payment_status !== "cancelled").reduce((s, r) => s + Number(r.total_amount), 0);
    return { month: ym, income, expenses, net: income - expenses };
  });

  // Category breakdown for expenses (current period)
  const expenseByCategory: Record<string, number> = {};
  rows.filter(r => r.transaction_type === "expense" && r.payment_status !== "cancelled").forEach(r => {
    expenseByCategory[r.category] = (expenseByCategory[r.category] ?? 0) + Number(r.total_amount);
  });

  const topExpenseCategories = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, amount]) => ({ category, amount }));

  return NextResponse.json({
    totals: {
      total_income:    totalIncome,
      total_expenses:  totalExpenses,
      net_profit:      totalIncome - totalExpenses,
      pending_income:  pendingIn,
      overdue_income:  overdueIn,
      pending_expenses: pendingOut,
    },
    monthly,
    top_expense_categories: topExpenseCategories,
  });
}
