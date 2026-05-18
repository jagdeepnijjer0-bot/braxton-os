/**
 * Deterministic mock AI outputs.
 * All functions are pure and produce the same output for the same input —
 * safe to call in server components and route handlers with no side effects.
 */
import type { LeadScore, ScoreLabel } from "./scoring";
import type { TaskSuggestion } from "./suggestions";
import type { SentimentResult } from "./smart-notifications";

// ── Deterministic hash ────────────────────────────────────────────────────────

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: readonly T[], seed: string): T {
  return arr[hash(seed) % arr.length];
}

// ── Lead scoring ─────────────────────────────────────────────────────────────

const MOCK_REASONINGS = [
  "High-intent investor with confirmed budget and referral source — strong pipeline fit.",
  "Warm prospect with full contact details captured; follow-up due soon.",
  "Letting agent from cold outreach — low urgency, monitor for engagement.",
  "Developer with active project timeline — strong product-market fit.",
  "Landlord enquiry via website form — moderate intent, needs qualification call.",
  "Facebook Lead Ad submission — intent unconfirmed, requires initial outreach.",
  "Returning contact with prior qualification session — re-engagement opportunity.",
  "AI automation prospect with clear brief and budget expectation stated.",
] as const;

const MOCK_FACTOR_SETS = [
  ["Referral source", "Budget confirmed in notes", "Follow-up overdue"],
  ["Has both email and phone", "Active lead type: investor", "Recent enquiry"],
  ["Cold source", "No contact info provided", "Lead age > 30 days"],
  ["High-value lead type", "Project timeline mentioned", "Contact details complete"],
  ["Website form source", "Standard lead type", "No follow-up date set"],
  ["Lead Ad source", "Low engagement signal", "Status: lead"],
  ["Returning contact", "Prior activity logged", "Follow-up previously set"],
  ["Direct referral", "SaaS/AI lead type", "Urgency stated in notes"],
] as const;

export function mockScore(seed: string): LeadScore {
  const h = hash(seed);
  // Spread across 0–99, weighted toward warm band (40–69)
  const raw = h % 100;
  const score = raw < 20 ? raw + 5           // cold: 5–24
              : raw < 65 ? 35 + (raw - 20)   // warm: 35–79
              : 70 + (raw - 65);             // hot:  70–99 (capped)
  const capped = Math.min(99, score);
  const label: ScoreLabel = capped >= 70 ? "hot" : capped >= 40 ? "warm" : "cold";

  return {
    score:       capped,
    label,
    reasoning:   pick(MOCK_REASONINGS, seed),
    key_factors: [...pick(MOCK_FACTOR_SETS, seed + "_factors")],
  };
}

// ── Contact summary ───────────────────────────────────────────────────────────

const MOCK_CONTACT_SUMMARIES = [
  "Investor seeking BRR deals in the Midlands with £200k–£300k budget — referred via existing client, follow-up overdue.",
  "Landlord with 4 properties seeking full management in Birmingham — submitted website form, moderate urgency.",
  "AI automation prospect from LinkedIn outreach — interested in automating property management workflows.",
  "Developer enquiring about a property platform build — budget not yet confirmed, initial scoping needed.",
  "Letting agent from Coventry seeking a sourcing partnership — discovery call booked.",
  "Maintenance client with urgent repair request across 2 HMOs — contact details confirmed.",
  "Early-stage investor doing initial research — low urgency but high long-term potential, nurture recommended.",
  "Facebook Lead Ad submission — BRR investor interested in joint ventures, qualification required.",
] as const;

export function mockContactSummary(seed: string): string {
  return pick(MOCK_CONTACT_SUMMARIES, seed);
}

// ── Conversation summary ──────────────────────────────────────────────────────

const MOCK_CONV_SUMMARIES = [
  "High-urgency AI automation enquiry — developer requested pricing and a 4-week timeline, positive tone.",
  "Instagram DM from potential investor asking about deal sourcing services — short thread, positive intent.",
  "Facebook message requesting a call-back for HMO management — responsive, phone number provided.",
  "Lead Ad submission for property investment mentorship — budget not stated, qualification required.",
  "Website chat from landlord unhappy with current agent — strong switch intent, act quickly.",
  "Ongoing conversation with qualified investor — two messages exchanged, awaiting proposal feedback.",
] as const;

export function mockConvSummary(seed: string): string {
  return pick(MOCK_CONV_SUMMARIES, seed);
}

// ── Form submission summary ───────────────────────────────────────────────────

const MOCK_FORM_SUMMARIES = [
  "Landlord with 2 properties in Solihull seeking full letting management — urgent due to issues with current agent.",
  "Investor with £150k looking for off-market BRR deals — first enquiry, qualification call required.",
  "Website/app project for a property portal — initial scoping needed, no budget stated.",
  "AI automation enquiry for client onboarding workflow — small business, eager to start immediately.",
  "Emergency boiler repair request across HMO in Coventry — high urgency, maintenance team to action.",
] as const;

export function mockFormSummary(seed: string): string {
  return pick(MOCK_FORM_SUMMARIES, seed);
}

// ── Task suggestions ──────────────────────────────────────────────────────────

const MOCK_SUGGESTION_SETS: TaskSuggestion[][] = [
  [
    {
      title:       "Book discovery call",
      description: "Schedule a 30-min call to understand budget, timeline, and specific requirements.",
      task_type:   "call",
      priority:    "high",
      reason:      "Hot lead not contacted recently — risk of going cold.",
    },
    {
      title:       "Send introductory proposal",
      description: "Prepare and send a tailored proposal based on the lead's stated needs.",
      task_type:   "follow_up",
      priority:    "high",
      reason:      "Lead is qualified and awaiting the next step.",
    },
    {
      title:       "Update CRM status",
      description: "Log call outcome, update status, and set next follow-up date.",
      task_type:   "admin",
      priority:    "medium",
      reason:      "Keep CRM accurate after outreach.",
    },
  ],
  [
    {
      title:       "Follow up via email",
      description: "Send a follow-up email checking in and offering to answer any questions.",
      task_type:   "follow_up",
      priority:    "medium",
      reason:      "No contact in 5+ days.",
    },
    {
      title:       "Request supporting documents",
      description: "Ask for any documents needed to progress the deal or qualify the lead.",
      task_type:   "admin",
      priority:    "medium",
      reason:      "Natural next step in the pipeline.",
    },
  ],
  [
    {
      title:       "Re-engage cold lead",
      description: "Send a short re-engagement message with a relevant insight or case study.",
      task_type:   "outreach",
      priority:    "low",
      reason:      "Lead has gone quiet — low-effort nudge worth trying.",
    },
    {
      title:       "Review and update lead status",
      description: "Assess current pipeline position and update status accordingly.",
      task_type:   "admin",
      priority:    "low",
      reason:      "Status appears stale — keep pipeline accurate.",
    },
  ],
];

export function mockSuggestions(seed: string): TaskSuggestion[] {
  return pick(MOCK_SUGGESTION_SETS, seed);
}

// ── Sentiment analysis ────────────────────────────────────────────────────────

const MOCK_SENTIMENTS: SentimentResult[] = [
  { negative: false, score: 82, reason: "Messages are polite and enthusiastic, showing genuine interest." },
  { negative: false, score: 61, reason: "Neutral tone with some hesitation, but no negative signals." },
  { negative: true,  score: 38, reason: "Messages show mild frustration — may indicate unmet expectations." },
  { negative: false, score: 75, reason: "Positive and responsive — lead is engaged and asking good questions." },
  { negative: true,  score: 28, reason: "Tone has shifted negative — contact appears dissatisfied or impatient." },
];

export function mockSentiment(seed: string): SentimentResult {
  return pick(MOCK_SENTIMENTS, seed);
}
