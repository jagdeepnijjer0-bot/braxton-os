import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import TransactionForm from "@/app/components/finance/TransactionForm";

interface Props { params: Promise<{ id: string }> }

export default async function EditTransactionPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: tx, error } = await supabase
    .from("finance_transactions").select("*").eq("id", id).single();

  if (error || !tx) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/finance" className="hover:text-gray-600 transition-colors">Finance</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium truncate max-w-[240px]">{tx.item_name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Edit</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Transaction</h1>
        <p className="text-sm text-gray-500 mt-1">Update <span className="font-medium text-gray-700">{tx.item_name}</span>.</p>
      </div>
      <TransactionForm mode="edit" txId={id} initial={tx} />
    </div>
  );
}
