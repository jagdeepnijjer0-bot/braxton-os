// Auto-maintained types mirroring the database schema.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ── CRM ──────────────────────────────────────────────────────
export type LeadType =
  | "letting_agent"
  | "sourcer"
  | "developer"
  | "landlord"
  | "investor"
  | "maintenance_client"
  | "website_app_prospect"
  | "ai_automation_prospect";

export type ContactStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_sent"
  | "negotiating"
  | "closed_won"
  | "closed_lost"
  | "follow_up";

export type ContactActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "status_change"
  | "follow_up_set"
  | "created";

// Keep the old name as an alias so existing imports don't break
export type ActivityType = ContactActivityType;

// ── FINANCE ───────────────────────────────────────────────────
export type TransactionType = "income" | "expense";
export type PaymentStatus   = "paid" | "pending" | "overdue" | "cancelled";
export type PaymentMethod   = "bank_transfer" | "cash" | "card" | "bacs" | "cheque" | "stripe" | "paypal";
export type RecurringInterval = "weekly" | "monthly" | "quarterly" | "yearly";

// ── PROJECTS ──────────────────────────────────────────────────
export type ProjectStage =
  | "planning"
  | "demolition"
  | "first_fix"
  | "second_fix"
  | "decorating"
  | "snagging"
  | "completed"
  | "on_hold";

export type ProjectActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "stage_change"
  | "cost_update"
  | "created"
  | "photo";

export type CostDirection = "in" | "out";

// ── DEALS ─────────────────────────────────────────────────────
export type DealStage =
  | "lead_found"
  | "reviewing"
  | "offer_made"
  | "under_negotiation"
  | "investor_interested"
  | "legals"
  | "refurb"
  | "sold_completed"
  | "dead";

export type InvestorStatus = "none" | "interested" | "confirmed" | "withdrawn";
export type SolicitorStatus = "not_instructed" | "instructed" | "progressing" | "completed";

export type DealActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "stage_change"
  | "offer_made"
  | "created"
  | "financial_update";

// ── Supabase-js v2 requirement ────────────────────────────────
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      // ── users ──────────────────────────────────────────────
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "admin" | "member" | "viewer";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      } & NoRelationships;

      // ── contacts ───────────────────────────────────────────
      contacts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          company: string | null;
          role: string | null;
          email: string | null;
          phone: string | null;
          lead_type: LeadType | null;
          source: string | null;
          status: ContactStatus;
          notes: string | null;
          follow_up_date: string | null;
          last_contacted: string | null;
          assigned_to: string | null;
        };
        Insert: {
          name: string;
          status?: ContactStatus;
          company?: string | null;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          lead_type?: LeadType | null;
          source?: string | null;
          notes?: string | null;
          follow_up_date?: string | null;
          last_contacted?: string | null;
          assigned_to?: string | null;
        };
        Update: {
          name?: string;
          status?: ContactStatus;
          company?: string | null;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          lead_type?: LeadType | null;
          source?: string | null;
          notes?: string | null;
          follow_up_date?: string | null;
          last_contacted?: string | null;
          assigned_to?: string | null;
        };
      } & NoRelationships;

      // ── contact_activities ─────────────────────────────────
      contact_activities: {
        Row: {
          id: string;
          contact_id: string;
          created_at: string;
          type: ContactActivityType;
          body: string;
          metadata: Json | null;
          created_by: string | null;
        };
        Insert: {
          contact_id: string;
          type: ContactActivityType;
          body: string;
          metadata?: Json | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_activities"]["Insert"]>;
      } & NoRelationships;

      // ── deals ──────────────────────────────────────────────
      deals: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          deal_name: string;
          address: string | null;
          purchase_price: number | null;
          estimated_value: number | null;
          monthly_rent: number | null;
          refurb_cost: number | null;
          projected_profit: number | null;
          investor_status: InvestorStatus;
          solicitor_status: SolicitorStatus;
          stage: DealStage;
          notes: string | null;
          next_action: string | null;
          target_completion_date: string | null;
          linked_contact_id: string | null;
          assigned_to: string | null;
        };
        Insert: {
          deal_name: string;
          stage?: DealStage;
          investor_status?: InvestorStatus;
          solicitor_status?: SolicitorStatus;
          address?: string | null;
          purchase_price?: number | null;
          estimated_value?: number | null;
          monthly_rent?: number | null;
          refurb_cost?: number | null;
          projected_profit?: number | null;
          notes?: string | null;
          next_action?: string | null;
          target_completion_date?: string | null;
          linked_contact_id?: string | null;
          assigned_to?: string | null;
        };
        Update: {
          deal_name?: string;
          stage?: DealStage;
          investor_status?: InvestorStatus;
          solicitor_status?: SolicitorStatus;
          address?: string | null;
          purchase_price?: number | null;
          estimated_value?: number | null;
          monthly_rent?: number | null;
          refurb_cost?: number | null;
          projected_profit?: number | null;
          notes?: string | null;
          next_action?: string | null;
          target_completion_date?: string | null;
          linked_contact_id?: string | null;
          assigned_to?: string | null;
        };
      } & NoRelationships;

      // ── deal_activities ────────────────────────────────────
      deal_activities: {
        Row: {
          id: string;
          deal_id: string;
          created_at: string;
          type: DealActivityType;
          body: string;
          metadata: Json | null;
          created_by: string | null;
        };
        Insert: {
          deal_id: string;
          type: DealActivityType;
          body: string;
          metadata?: Json | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["deal_activities"]["Insert"]>;
      } & NoRelationships;

      // ── projects ───────────────────────────────────────────
      projects: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          project_name: string;
          linked_deal_id: string | null;
          contractor_name: string | null;
          stage: ProjectStage;
          budget: number | null;
          amount_spent: number | null;
          projected_profit: number | null;
          progress_percentage: number | null;
          start_date: string | null;
          target_completion_date: string | null;
          notes: string | null;
          assigned_to: string | null;
        };
        Insert: {
          project_name: string;
          stage?: ProjectStage;
          linked_deal_id?: string | null;
          contractor_name?: string | null;
          budget?: number | null;
          amount_spent?: number | null;
          projected_profit?: number | null;
          progress_percentage?: number | null;
          start_date?: string | null;
          target_completion_date?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
        };
        Update: {
          project_name?: string;
          stage?: ProjectStage;
          linked_deal_id?: string | null;
          contractor_name?: string | null;
          budget?: number | null;
          amount_spent?: number | null;
          projected_profit?: number | null;
          progress_percentage?: number | null;
          start_date?: string | null;
          target_completion_date?: string | null;
          notes?: string | null;
          assigned_to?: string | null;
        };
      } & NoRelationships;

      // ── project_activities ────────────────────────────────
      project_activities: {
        Row: {
          id: string;
          project_id: string;
          created_at: string;
          type: ProjectActivityType;
          body: string;
          metadata: Json | null;
          created_by: string | null;
        };
        Insert: {
          project_id: string;
          type: ProjectActivityType;
          body: string;
          metadata?: Json | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["project_activities"]["Insert"]>;
      } & NoRelationships;

      // ── project_costs ─────────────────────────────────────
      project_costs: {
        Row: {
          id: string;
          project_id: string;
          created_at: string;
          label: string;
          amount: number;
          direction: CostDirection;
          category: string | null;
          date: string;
          notes: string | null;
        };
        Insert: {
          project_id: string;
          label: string;
          amount: number;
          direction?: CostDirection;
          category?: string | null;
          date?: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["project_costs"]["Insert"]>;
      } & NoRelationships;

      // ── finance_transactions ──────────────────────────────
      finance_transactions: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          transaction_date: string;
          transaction_type: TransactionType;
          category: string;
          item_name: string;
          amount: number;
          quantity: number;
          total_amount: number;
          payment_method: PaymentMethod | null;
          payment_status: PaymentStatus;
          is_recurring: boolean;
          recurring_interval: RecurringInterval | null;
          linked_project_id: string | null;
          linked_deal_id: string | null;
          linked_contact_id: string | null;
          notes: string | null;
        };
        Insert: {
          transaction_date?: string;
          transaction_type: TransactionType;
          category: string;
          item_name: string;
          amount: number;
          quantity?: number;
          total_amount: number;
          payment_method?: PaymentMethod | null;
          payment_status?: PaymentStatus;
          is_recurring?: boolean;
          recurring_interval?: RecurringInterval | null;
          linked_project_id?: string | null;
          linked_deal_id?: string | null;
          linked_contact_id?: string | null;
          notes?: string | null;
        };
        Update: {
          transaction_date?: string;
          transaction_type?: TransactionType;
          category?: string;
          item_name?: string;
          amount?: number;
          quantity?: number;
          total_amount?: number;
          payment_method?: PaymentMethod | null;
          payment_status?: PaymentStatus;
          is_recurring?: boolean;
          recurring_interval?: RecurringInterval | null;
          linked_project_id?: string | null;
          linked_deal_id?: string | null;
          linked_contact_id?: string | null;
          notes?: string | null;
        };
      } & NoRelationships;

      // ── outreach_campaigns ─────────────────────────────────
      outreach_campaigns: {
        Row: {
          id: string;
          name: string;
          status: "draft" | "active" | "paused" | "completed";
          owner_id: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["outreach_campaigns"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["outreach_campaigns"]["Insert"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
