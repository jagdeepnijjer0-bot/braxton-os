import Link from "next/link";

const STAGE_PILL: Record<string, string> = {
  lead_found:          "bg-slate-100 text-slate-700",
  reviewing:           "bg-sky-100 text-sky-700",
  offer_made:          "bg-indigo-100 text-indigo-700",
  under_negotiation:   "bg-violet-100 text-violet-700",
  investor_interested: "bg-amber-100 text-amber-700",
  legals:              "bg-orange-100 text-orange-700",
  refurb:              "bg-emerald-100 text-emerald-700",
  sold_completed:      "bg-green-100 text-green-700",
  dead:                "bg-gray-100 text-gray-500",
};

const STAGE_LABEL: Record<string, string> = {
  lead_found:          "Lead Found",
  reviewing:           "Reviewing",
  offer_made:          "Offer Made",
  under_negotiation:   "Negotiation",
  investor_interested: "Investor",
  legals:              "Legals",
  refurb:              "Refurb",
  sold_completed:      "Completed",
  dead:                "Dead",
};

interface Deal {
  id: string;
  deal_name: string;
  stage: string;
  projected_profit: number | null;
  purchase_price: number | null;
  address: string | null;
}

interface Props {
  deals: Deal[];
}

export default function RecentDeals({ deals }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Recent Deals</h2>
        <Link href="/deal-tracker" className="text-xs text-indigo-600 hover:underline font-medium">View all</Link>
      </div>
      {deals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No deals yet</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {deals.map(deal => (
            <Link
              key={deal.id}
              href={`/deal-tracker/${deal.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{deal.deal_name}</p>
                {deal.address && (
                  <p className="text-xs text-gray-500 truncate">{deal.address}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_PILL[deal.stage] ?? STAGE_PILL.dead}`}>
                  {STAGE_LABEL[deal.stage] ?? deal.stage}
                </span>
                {deal.projected_profit !== null && deal.projected_profit > 0 && (
                  <span className="text-xs font-bold text-emerald-600">
                    £{deal.projected_profit.toLocaleString("en-GB")}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
