import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  getDealStage, getInvestorStatus, getSolicitorStatus,
  formatCurrency, formatYield, formatROI,
  DEAL_STAGES,
} from "@/lib/constants/deals";
import DealActivityTimeline from "@/app/components/deals/DealActivityTimeline";
import StageBadge from "@/app/components/deals/StageBadge";
import FileAttachments from "@/app/components/files/FileAttachments";

interface Props { params: Promise<{ id: string }> }

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  );
}

export default async function DealDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();

  const [{ data: deal, error }, { data: activities }] = await Promise.all([
    supabase.from("deals").select("*").eq("id", id).single(),
    supabase
      .from("deal_activities")
      .select("*")
      .eq("deal_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (error || !deal) notFound();

  type ContactRow = { id: string; name: string; email: string | null; phone: string | null; company: string | null };
  let contact: ContactRow | null = null;
  if (deal.linked_contact_id) {
    const { data: c } = await supabase
      .from("contacts")
      .select("id, name, email, phone, company")
      .eq("id", deal.linked_contact_id)
      .single();
    contact = c as ContactRow | null;
  }

  const stage     = getDealStage(deal.stage);
  const investor  = getInvestorStatus(deal.investor_status);
  const solicitor = getSolicitorStatus(deal.solicitor_status);

  const profitColor = deal.projected_profit != null && deal.projected_profit >= 0
    ? "text-emerald-600"
    : "text-red-600";

  const stageOrder = DEAL_STAGES.map((s) => s.value);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/deal-tracker" className="hover:text-gray-600 transition-colors">Deal Tracker</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium truncate">{deal.deal_name}</span>
      </nav>

      {/* Hero */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-6">
        {/* Stage colour strip */}
        <div className={`h-1.5 ${stage.dot.replace("bg-", "bg-")}`} style={{ background: `var(--stage-color, #6366f1)` }} />
        <div className={`h-1.5 w-full ${stage.dot}`} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <StageBadge value={deal.stage} />
                {investor.value !== "none" && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${investor.color}`}>
                    👤 {investor.label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{deal.deal_name}</h1>
              {deal.address && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {deal.address}
                </p>
              )}
              {deal.target_completion_date && (
                <p className="text-xs text-gray-400 mt-2">
                  Target completion: <span className="font-medium text-gray-600">{new Date(deal.target_completion_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/deal-tracker/${id}/edit`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </Link>
            </div>
          </div>

          {/* Stage progress bar */}
          <div className="mt-5">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {DEAL_STAGES.filter(s => s.value !== "dead").map((s, i) => {
                const isActive = s.value === deal.stage;
                const isPast   = stageOrder.indexOf(s.value) < stageOrder.indexOf(deal.stage ?? "");
                return (
                  <div key={s.value} className="flex items-center gap-1 min-w-0">
                    {i > 0 && <div className={`w-3 h-px flex-shrink-0 ${isPast || isActive ? "bg-indigo-300" : "bg-gray-200"}`} />}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      isActive ? `${s.bg} ${s.color} ring-1 ring-inset ring-current/20` :
                      isPast   ? "bg-indigo-50 text-indigo-400" :
                                 "bg-gray-50 text-gray-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? s.dot : isPast ? "bg-indigo-300" : "bg-gray-200"}`} />
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Purchase Price"  value={formatCurrency(deal.purchase_price)} />
        <StatCard label="GDV"             value={formatCurrency(deal.estimated_value)} sub="After refurb" />
        <StatCard
          label="Projected Profit"
          value={deal.projected_profit != null ? formatCurrency(deal.projected_profit) : "—"}
          sub={formatROI(deal.projected_profit, deal.purchase_price) !== "—" ? `ROI: ${formatROI(deal.projected_profit, deal.purchase_price)}` : undefined}
        />
        <StatCard
          label="Gross Yield"
          value={formatYield(deal.monthly_rent, deal.purchase_price)}
          sub={deal.monthly_rent ? `${formatCurrency(deal.monthly_rent)}/mo` : undefined}
        />
      </div>

      {/* Files & Attachments — full-width section */}
      <FileAttachments entityType="deal" entityId={id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: details */}
        <div className="lg:col-span-1 space-y-5">
          {/* Financials */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Financials</h3>
            <div>
              <InfoRow label="Purchase Price" value={formatCurrency(deal.purchase_price)} />
              <InfoRow label="Estimated Value" value={formatCurrency(deal.estimated_value)} />
              <InfoRow label="Refurb Cost"    value={formatCurrency(deal.refurb_cost)} />
              <InfoRow label="Monthly Rent"   value={deal.monthly_rent ? formatCurrency(deal.monthly_rent) : null} />
              {deal.projected_profit != null && (
                <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-4">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider flex-shrink-0 pt-0.5">Projected Profit</span>
                  <span className={`text-sm font-bold text-right ${profitColor}`}>{formatCurrency(deal.projected_profit)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Investor</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${investor.color}`}>{investor.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Solicitor</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${solicitor.color}`}>{solicitor.label}</span>
              </div>
            </div>
          </div>

          {/* Linked contact */}
          {contact && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Linked Contact</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <Link href={`/crm/${contact.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors block truncate">
                    {contact.name}
                  </Link>
                  {contact.company && <p className="text-xs text-gray-400 truncate">{contact.company}</p>}
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.29h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Next action & notes */}
          {(deal.next_action || deal.notes) && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl shadow-sm p-5">
              <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">Notes & Next Action</h3>
              {deal.next_action && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-amber-600 mb-1">Next Action</p>
                  <p className="text-sm text-amber-900">{deal.next_action}</p>
                </div>
              )}
              {deal.notes && (
                <div>
                  <p className="text-xs font-medium text-amber-600 mb-1">Notes</p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{deal.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: activity timeline */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Activity</h3>
            <DealActivityTimeline
              dealId={id}
              activities={(activities ?? []).map((a) => ({
                id: a.id,
                type: a.type,
                body: a.body,
                created_at: a.created_at,
                metadata: a.metadata ?? undefined,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

