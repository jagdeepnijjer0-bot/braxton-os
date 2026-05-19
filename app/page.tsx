import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import KpiCard from "./components/dashboard/KpiCard";
import PipelineBar from "./components/dashboard/PipelineBar";
import FinanceSummary from "./components/dashboard/FinanceSummary";
import RecentDeals from "./components/dashboard/RecentDeals";
import ProjectCards from "./components/dashboard/ProjectCards";
import UpcomingEvents from "./components/dashboard/UpcomingEvents";
import ActivityFeed, { type ActivityItem } from "./components/dashboard/ActivityFeed";
import NotificationsList from "./components/dashboard/NotificationsList";
import DashboardRefresh from "./components/dashboard/DashboardRefresh";

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return "£" + (n / 1_000_000).toFixed(1) + "m";
  if (n >= 1_000)     return "£" + (n / 1_000).toFixed(0) + "k";
  return "£" + n.toLocaleString("en-GB");
}

// ─── Cached data fetcher — results reused for 60 s per user ─────────────────
// unstable_cache keys by [userId, monthKey] so each user sees their own data
// and the cache naturally rotates on month change.

async function fetchDashboardData(userId: string, monthKey: string) {
  const supabase = await createServerClient();

  const now              = new Date();
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo    = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysFromNow = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000).toISOString();

  const [
    contactsTotalRes, contactsNewRes, dealsRes, projectsRes, financeRes,
    overdueTasksRes, unreadInboxRes, outreachRepliesRes, bookedCallsRes,
    hotLeadsRes, eventsRes, notifsRes, contactActsRes, dealActsRes,
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("deals").select("id, deal_name, stage, projected_profit, purchase_price, address").neq("stage", "dead").order("created_at", { ascending: false }).limit(50),
    supabase.from("projects").select("id, project_name, stage, progress_percentage, budget, amount_spent").neq("stage", "completed").order("created_at", { ascending: false }).limit(6),
    supabase.from("finance_transactions").select("transaction_type, total_amount").gte("transaction_date", startOfMonth).limit(500),
    supabase.from("tasks").select("*", { count: "exact", head: true }).in("status", ["todo", "in_progress"]).lt("due_date", now.toISOString()),
    supabase.from("inbox_conversations").select("*", { count: "exact", head: true }).eq("is_read", false),
    supabase.from("outreach_leads").select("*", { count: "exact", head: true }).in("reply_status", ["replied", "positive"]),
    supabase.from("outreach_leads").select("*", { count: "exact", head: true }).eq("booked_call", true),
    supabase.from("qualification_sessions").select("*", { count: "exact", head: true }).eq("heat", "hot"),
    supabase.from("calendar_events").select("id, title, event_type, start_datetime, end_datetime, all_day").gte("start_datetime", now.toISOString()).lte("start_datetime", sevenDaysFromNow).order("start_datetime", { ascending: true }).limit(8),
    supabase.from("notifications").select("id, title, body, type, priority, created_at, is_read, link_url").eq("is_read", false).order("created_at", { ascending: false }).limit(6),
    supabase.from("contact_activities").select("id, created_at, type, body, contact_id").order("created_at", { ascending: false }).limit(8),
    supabase.from("deal_activities").select("id, created_at, type, body, deal_id").order("created_at", { ascending: false }).limit(8),
  ]);

  // Suppress unused-variable warning — monthKey is only used as a cache-key discriminator
  void monthKey;

  return {
    contactsTotal: contactsTotalRes.count ?? 0,
    contactsNew:   contactsNewRes.count   ?? 0,
    deals:         dealsRes.data          ?? [],
    projects:      projectsRes.data       ?? [],
    finTxns:       financeRes.data        ?? [],
    overdueTasks:  overdueTasksRes.count  ?? 0,
    unreadInbox:   unreadInboxRes.count   ?? 0,
    outreachReplies: outreachRepliesRes.count ?? 0,
    bookedCalls:   bookedCallsRes.count   ?? 0,
    hotLeads:      hotLeadsRes.count      ?? 0,
    events:        eventsRes.data         ?? [],
    notifications: notifsRes.data         ?? [],
    contactActs:   contactActsRes.data    ?? [],
    dealActs:      dealActsRes.data       ?? [],
  };
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId   = user?.id ?? "anon";

  const now        = new Date();
  const monthKey   = `${now.getFullYear()}-${now.getMonth()}`;
  const monthLabel = now.toLocaleString("en-GB", { month: "long", year: "numeric" });

  // Cache per-user, rotates every 60 s and on month change
  const getCached = unstable_cache(
    () => fetchDashboardData(userId, monthKey),
    ["dashboard", userId, monthKey],
    { revalidate: 60, tags: ["dashboard"] },
  );

  const {
    contactsTotal: totalContacts,
    contactsNew:   newLeads,
    deals:         allDeals,
    projects,
    finTxns,
    overdueTasks,
    unreadInbox,
    outreachReplies,
    bookedCalls,
    hotLeads,
    events,
    notifications,
    contactActs:   contactActsData,
    dealActs:      dealActsData,
  } = await getCached();

  // ── Derived KPIs ──────────────────────────────────────────────────────────

  const deals         = allDeals;
  const activeDeals   = deals.length;
  const pipelineValue = deals.reduce((s, d) => s + (d.projected_profit ?? 0), 0);
  const recentDeals   = deals.slice(0, 6);

  // Deal stage breakdown
  const stageCounts: Record<string, number> = {};
  const stageValues: Record<string, number> = {};
  deals.forEach(d => {
    stageCounts[d.stage] = (stageCounts[d.stage] ?? 0) + 1;
    stageValues[d.stage] = (stageValues[d.stage] ?? 0) + (d.projected_profit ?? 0);
  });

  const moneyIn   = finTxns.filter(t => t.transaction_type === "income").reduce((s, t) => s + (t.total_amount ?? 0), 0);
  const moneyOut  = finTxns.filter(t => t.transaction_type === "expense").reduce((s, t) => s + (t.total_amount ?? 0), 0);
  const netProfit = moneyIn - moneyOut;

  const unreadNotifsCount = notifications.length;

  // ── Combined activity feed ────────────────────────────────────────────────
  const contactActs: ActivityItem[] = contactActsData.map(a => ({
    id:         a.id,
    created_at: a.created_at,
    type:       a.type,
    body:       a.body,
    source:     "contact" as const,
    label:      "CRM",
    href:       `/crm/${a.contact_id}`,
  }));
  const dealActs: ActivityItem[] = dealActsData.map(a => ({
    id:         a.id,
    created_at: a.created_at,
    type:       a.type,
    body:       a.body,
    source:     "deal" as const,
    label:      "Deal",
    href:       `/deal-tracker/${a.deal_id}`,
  }));
  const activityFeed = [...contactActs, ...dealActs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  // ── KPI cards config ──────────────────────────────────────────────────────

  const kpis = [
    {
      label: "Total Contacts",
      value: totalContacts,
      sub: "in CRM",
      color: "indigo" as const,
      href: "/crm",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: "New Leads",
      value: newLeads,
      sub: "last 30 days",
      color: "sky" as const,
      href: "/crm",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
    },
    {
      label: "Pipeline Value",
      value: fmt(pipelineValue),
      sub: `${activeDeals} active deals`,
      color: "violet" as const,
      href: "/deal-tracker",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: "Active Deals",
      value: activeDeals,
      sub: "in pipeline",
      color: "indigo" as const,
      href: "/deal-tracker",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    },
    {
      label: "Net Profit",
      value: fmt(Math.abs(netProfit)),
      sub: `${monthLabel}`,
      color: netProfit >= 0 ? "emerald" as const : "rose" as const,
      href: "/finance",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    },
    {
      label: "Money In",
      value: fmt(moneyIn),
      sub: `${monthLabel}`,
      color: "emerald" as const,
      href: "/finance",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
    },
    {
      label: "Money Out",
      value: fmt(moneyOut),
      sub: `${monthLabel}`,
      color: "rose" as const,
      href: "/finance",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
    },
    {
      label: "Overdue Tasks",
      value: overdueTasks,
      sub: overdueTasks === 0 ? "all clear" : "need attention",
      color: overdueTasks > 0 ? "rose" as const : "emerald" as const,
      href: "/tasks",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      label: "Unread Inbox",
      value: unreadInbox,
      sub: "conversations",
      color: unreadInbox > 0 ? "amber" as const : "slate" as const,
      href: "/inbox",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
    },
    {
      label: "Outreach Replies",
      value: outreachReplies,
      sub: "total replied",
      color: "sky" as const,
      href: "/outreach",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    },
    {
      label: "Booked Calls",
      value: bookedCalls,
      sub: "from outreach",
      color: "emerald" as const,
      href: "/outreach",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.46 5.46l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    },
    {
      label: "Hot AI Leads",
      value: hotLeads,
      sub: "qualified",
      color: "amber" as const,
      href: "/crm",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <DashboardRefresh />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.map(k => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* Pipeline + Finance row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PipelineBar stageCounts={stageCounts} stageValues={stageValues} total={activeDeals} />
        <FinanceSummary moneyIn={moneyIn} moneyOut={moneyOut} month={monthLabel} />
      </div>

      {/* Deals + Projects row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentDeals deals={recentDeals} />
        <ProjectCards projects={projects} />
      </div>

      {/* Events + Activity + Notifications row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UpcomingEvents events={events} />
        <ActivityFeed items={activityFeed} />
        <NotificationsList notifications={notifications} unreadCount={unreadNotifsCount} />
      </div>

    </div>
  );
}
