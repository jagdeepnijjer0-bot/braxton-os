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

// ── TASKS / CALENDAR / NOTIFICATIONS ─────────────────────────
export type TaskStatus    = "todo" | "in_progress" | "completed" | "overdue" | "cancelled";
export type TaskPriority  = "low" | "medium" | "high" | "urgent";
export type TaskType      = "call" | "follow_up" | "meeting" | "refurb" | "finance" | "outreach" | "admin";
export type EventType     = "meeting" | "reminder" | "deadline" | "milestone" | "refurb" | "finance" | "other";
export type NotificationType = "task_overdue" | "follow_up_overdue" | "finance_overdue" | "meeting_upcoming" | "project_deadline" | "budget_warning" | "system";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

// ── INBOX ─────────────────────────────────────────────────────
export type InboxPlatform  = "email" | "whatsapp" | "instagram" | "facebook" | "linkedin" | "website_form";
export type InboxStatus    = "open" | "replied" | "waiting" | "follow_up" | "closed";
export type InboxPriority  = "low" | "normal" | "high" | "urgent";
export type MessageDirection = "inbound" | "outbound";

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

// ── Qualification types (used in Database interface below) ─────
export type QualLeadType =
  | "landlord" | "investor" | "developer" | "letting_agent" | "tenant"
  | "maintenance_inquiry" | "website_app_prospect" | "ai_automation_prospect"
  | "sourcer" | "sa_operator";

export type QualHeat = "hot" | "warm" | "cold";

export interface QualQuestion {
  id: string;
  text: string;
  type: "select" | "text" | "boolean" | "number";
  options?: { value: string; label: string; score: number }[];
  weight?: number;
}

export interface QualHeatThresholds { hot: number; warm: number; }
export interface QualReplyTemplates { hot: string; warm: string; cold: string; }
export interface QualNextActions    { hot: string; warm: string; cold: string; }

// ── Auth / Team types (used in Database interface below) ────────
export type UserRole = "admin" | "member" | "viewer";

// ── Supabase-js v2 requirement ────────────────────────────────
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      // ── form_submissions ───────────────────────────────────────
      form_submissions: {
        Row: {
          id:          string;
          created_at:  string;
          form_type:   FormType;
          contact_id:  string | null;
          data:        Record<string, unknown>;
          status:      FormStatus;
          notes:       string | null;
          assigned_to: string | null;
        };
        Insert: {
          form_type:   FormType;
          contact_id?: string | null;
          data?:       Record<string, unknown>;
          status?:     FormStatus;
          notes?:      string | null;
          assigned_to?: string | null;
        };
        Update: {
          status?:     FormStatus;
          notes?:      string | null;
          assigned_to?: string | null;
          contact_id?: string | null;
        };
      } & NoRelationships;

      // ── profiles ───────────────────────────────────────────────
      profiles: {
        Row: {
          id:         string;
          created_at: string;
          email:      string | null;
          full_name:  string | null;
          avatar_url: string | null;
          role:       UserRole;
          job_title:  string | null;
          phone:      string | null;
        };
        Insert: {
          id:          string;
          email?:      string | null;
          full_name?:  string | null;
          avatar_url?: string | null;
          role?:       UserRole;
          job_title?:  string | null;
          phone?:      string | null;
        };
        Update: {
          email?:      string | null;
          full_name?:  string | null;
          avatar_url?: string | null;
          role?:       UserRole;
          job_title?:  string | null;
          phone?:      string | null;
        };
      } & NoRelationships;

      // ── teams ──────────────────────────────────────────────────
      teams: {
        Row: {
          id:         string;
          created_at: string;
          name:       string;
          slug:       string;
          owner_id:   string | null;
        };
        Insert: {
          name:      string;
          slug:      string;
          owner_id?: string | null;
        };
        Update: {
          name?:     string;
          slug?:     string;
          owner_id?: string | null;
        };
      } & NoRelationships;

      // ── team_members ───────────────────────────────────────────
      team_members: {
        Row: {
          id:        string;
          team_id:   string;
          user_id:   string;
          role:      UserRole;
          joined_at: string;
        };
        Insert: {
          team_id:  string;
          user_id:  string;
          role?:    UserRole;
        };
        Update: {
          role?: UserRole;
        };
      } & NoRelationships;

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

      // ── tasks ─────────────────────────────────────────────
      tasks: {
        Row: {
          id: string; created_at: string; updated_at: string;
          title: string; description: string | null;
          status: TaskStatus; priority: TaskPriority; task_type: TaskType;
          due_date: string | null; completed_at: string | null;
          assigned_to: string | null;
          linked_contact_id: string | null; linked_deal_id: string | null;
          linked_project_id: string | null; linked_conversation_id: string | null;
        };
        Insert: {
          title: string;
          description?: string | null; status?: TaskStatus; priority?: TaskPriority;
          task_type?: TaskType; due_date?: string | null; completed_at?: string | null;
          assigned_to?: string | null; linked_contact_id?: string | null;
          linked_deal_id?: string | null; linked_project_id?: string | null;
          linked_conversation_id?: string | null;
        };
        Update: {
          title?: string; description?: string | null; status?: TaskStatus;
          priority?: TaskPriority; task_type?: TaskType; due_date?: string | null;
          completed_at?: string | null; assigned_to?: string | null;
          linked_contact_id?: string | null; linked_deal_id?: string | null;
          linked_project_id?: string | null; linked_conversation_id?: string | null;
        };
      } & NoRelationships;

      // ── calendar_events ────────────────────────────────────
      calendar_events: {
        Row: {
          id: string; created_at: string; updated_at: string;
          title: string; description: string | null;
          event_type: EventType; start_datetime: string;
          end_datetime: string | null; all_day: boolean; color: string | null;
          linked_task_id: string | null; linked_deal_id: string | null;
          linked_project_id: string | null; linked_contact_id: string | null;
          google_event_id: string | null;
        };
        Insert: {
          title: string; start_datetime: string;
          description?: string | null; event_type?: EventType;
          end_datetime?: string | null; all_day?: boolean; color?: string | null;
          linked_task_id?: string | null; linked_deal_id?: string | null;
          linked_project_id?: string | null; linked_contact_id?: string | null;
          google_event_id?: string | null;
        };
        Update: {
          title?: string; start_datetime?: string; description?: string | null;
          event_type?: EventType; end_datetime?: string | null;
          all_day?: boolean; color?: string | null;
          linked_task_id?: string | null; linked_deal_id?: string | null;
          linked_project_id?: string | null; linked_contact_id?: string | null;
          google_event_id?: string | null;
        };
      } & NoRelationships;

      // ── notifications ──────────────────────────────────────
      notifications: {
        Row: {
          id: string; created_at: string; title: string; body: string | null;
          type: NotificationType; priority: NotificationPriority;
          is_read: boolean; link_url: string | null;
          linked_entity_type: string | null; linked_entity_id: string | null;
          source_key: string | null;
        };
        Insert: {
          title: string; type: NotificationType;
          body?: string | null; priority?: NotificationPriority;
          is_read?: boolean; link_url?: string | null;
          linked_entity_type?: string | null; linked_entity_id?: string | null;
          source_key?: string | null;
        };
        Update: {
          title?: string; body?: string | null; type?: NotificationType;
          priority?: NotificationPriority; is_read?: boolean;
          link_url?: string | null; linked_entity_type?: string | null;
          linked_entity_id?: string | null; source_key?: string | null;
        };
      } & NoRelationships;

      // ── inbox_conversations ───────────────────────────────
      inbox_conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          contact_id: string | null;
          platform: InboxPlatform;
          subject: string | null;
          latest_message: string | null;
          latest_message_at: string | null;
          status: InboxStatus;
          assigned_category: string | null;
          ai_suggested_reply: string | null;
          next_action: string | null;
          priority: InboxPriority;
          assigned_to: string | null;
          is_read: boolean;
          contact_name: string | null;
          contact_email: string | null;
          external_thread_id: string | null;
        };
        Insert: {
          platform: InboxPlatform;
          contact_id?: string | null;
          subject?: string | null;
          latest_message?: string | null;
          latest_message_at?: string | null;
          status?: InboxStatus;
          assigned_category?: string | null;
          ai_suggested_reply?: string | null;
          next_action?: string | null;
          priority?: InboxPriority;
          assigned_to?: string | null;
          is_read?: boolean;
          contact_name?: string | null;
          contact_email?: string | null;
          external_thread_id?: string | null;
        };
        Update: {
          platform?: InboxPlatform;
          contact_id?: string | null;
          subject?: string | null;
          latest_message?: string | null;
          latest_message_at?: string | null;
          status?: InboxStatus;
          assigned_category?: string | null;
          ai_suggested_reply?: string | null;
          next_action?: string | null;
          priority?: InboxPriority;
          assigned_to?: string | null;
          is_read?: boolean;
          contact_name?: string | null;
          contact_email?: string | null;
          external_thread_id?: string | null;
        };
      } & NoRelationships;

      // ── inbox_messages ────────────────────────────────────
      inbox_messages: {
        Row: {
          id: string;
          conversation_id: string;
          created_at: string;
          direction: MessageDirection;
          body: string;
          sender_name: string | null;
          is_read: boolean;
          external_message_id: string | null;
        };
        Insert: {
          conversation_id: string;
          direction?: MessageDirection;
          body: string;
          sender_name?: string | null;
          is_read?: boolean;
          external_message_id?: string | null;
        };
        Update: {
          direction?: MessageDirection;
          body?: string;
          sender_name?: string | null;
          is_read?: boolean;
          external_message_id?: string | null;
        };
      } & NoRelationships;

      // ── meta_integration_settings ─────────────────────────
      meta_integration_settings: {
        Row: {
          id:           string;
          created_at:   string;
          updated_at:   string;
          platform:     "instagram" | "facebook";
          page_id:      string | null;
          page_name:    string | null;
          is_connected: boolean;
          connected_at: string | null;
        };
        Insert: {
          platform:     "instagram" | "facebook";
          page_id?:     string | null;
          page_name?:   string | null;
          is_connected?: boolean;
          connected_at?: string | null;
        };
        Update: {
          page_id?:     string | null;
          page_name?:   string | null;
          is_connected?: boolean;
          connected_at?: string | null;
        };
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
          id:             string;
          created_at:     string;
          updated_at:     string;
          campaign_name:  string;
          niche:          OutreachNiche;
          offer:          string | null;
          platform:       OutreachPlatform;
          status:         CampaignStatus;
          target_count:   number;
          description:    string | null;
          notes:          string | null;
          assigned_user:  string | null;
        };
        Insert: {
          campaign_name:  string;
          niche?:         OutreachNiche;
          offer?:         string | null;
          platform?:      OutreachPlatform;
          status?:        CampaignStatus;
          target_count?:  number;
          description?:   string | null;
          notes?:         string | null;
          assigned_user?: string | null;
        };
        Update: {
          campaign_name?:  string;
          niche?:          OutreachNiche;
          offer?:          string | null;
          platform?:       OutreachPlatform;
          status?:         CampaignStatus;
          target_count?:   number;
          description?:    string | null;
          notes?:          string | null;
          assigned_user?:  string | null;
        };
      } & NoRelationships;

      // ── outreach_leads ─────────────────────────────────────
      outreach_leads: {
        Row: {
          id:                 string;
          created_at:         string;
          updated_at:         string;
          campaign_id:        string;
          contact_name:       string;
          company:            string | null;
          email:              string | null;
          phone:              string | null;
          platform:           OutreachPlatform;
          lead_source:        string | null;
          status:             LeadStatus;
          step:               number;
          reply_status:       ReplyStatus;
          booked_call:        boolean;
          booked_call_at:     string | null;
          closed_deal:        boolean;
          closed_at:          string | null;
          linked_contact_id:  string | null;
          assigned_user:      string | null;
          notes:              string | null;
          next_follow_up:     string | null;
          last_contacted_at:  string | null;
        };
        Insert: {
          campaign_id:        string;
          contact_name:       string;
          company?:           string | null;
          email?:             string | null;
          phone?:             string | null;
          platform?:          OutreachPlatform;
          lead_source?:       string | null;
          status?:            LeadStatus;
          step?:              number;
          reply_status?:      ReplyStatus;
          booked_call?:       boolean;
          closed_deal?:       boolean;
          linked_contact_id?: string | null;
          assigned_user?:     string | null;
          notes?:             string | null;
          next_follow_up?:    string | null;
          last_contacted_at?: string | null;
        };
        Update: {
          contact_name?:      string;
          company?:           string | null;
          email?:             string | null;
          phone?:             string | null;
          platform?:          OutreachPlatform;
          lead_source?:       string | null;
          status?:            LeadStatus;
          step?:              number;
          reply_status?:      ReplyStatus;
          booked_call?:       boolean;
          closed_deal?:       boolean;
          linked_contact_id?: string | null;
          assigned_user?:     string | null;
          notes?:             string | null;
          next_follow_up?:    string | null;
          last_contacted_at?: string | null;
        };
      } & NoRelationships;

      // ── outreach_activities ────────────────────────────────
      outreach_activities: {
        Row: {
          id:             string;
          created_at:     string;
          lead_id:        string;
          campaign_id:    string;
          activity_type:  OutreachActivityType;
          body:           string | null;
          created_by:     string | null;
        };
        Insert: {
          lead_id:        string;
          campaign_id:    string;
          activity_type?: OutreachActivityType;
          body?:          string | null;
          created_by?:    string | null;
        };
        Update: {
          body?:          string | null;
          created_by?:    string | null;
        };
      } & NoRelationships;

      // ── qualification_templates ───────────────────────────────
      qualification_templates: {
        Row: {
          id:               string;
          created_at:       string;
          lead_type:        string;
          label:            string;
          description:      string | null;
          questions:        QualQuestion[];
          heat_thresholds:  QualHeatThresholds;
          reply_templates:  QualReplyTemplates;
          next_actions:     QualNextActions;
          crm_fields:       string[];
          deal_fields:      string[];
        };
        Insert: {
          lead_type:        string;
          label:            string;
          description?:     string | null;
          questions?:       QualQuestion[];
          heat_thresholds?: QualHeatThresholds;
          reply_templates?: QualReplyTemplates;
          next_actions?:    QualNextActions;
          crm_fields?:      string[];
          deal_fields?:     string[];
        };
        Update: {
          label?:           string;
          description?:     string | null;
          questions?:       QualQuestion[];
          heat_thresholds?: QualHeatThresholds;
          reply_templates?: QualReplyTemplates;
          next_actions?:    QualNextActions;
          crm_fields?:      string[];
          deal_fields?:     string[];
        };
      } & NoRelationships;

      // ── qualification_sessions ─────────────────────────────────
      qualification_sessions: {
        Row: {
          id:               string;
          created_at:       string;
          lead_type:        string;
          contact_id:       string | null;
          conversation_id:  string | null;
          answers:          Record<string, string>;
          score:            number;
          heat:             QualHeat;
          notes:            string | null;
          suggested_reply:  string | null;
          next_action:      string | null;
          created_by:       string | null;
        };
        Insert: {
          lead_type:        string;
          contact_id?:      string | null;
          conversation_id?: string | null;
          answers?:         Record<string, string>;
          score?:           number;
          heat?:            QualHeat;
          notes?:           string | null;
          suggested_reply?: string | null;
          next_action?:     string | null;
          created_by?:      string | null;
        };
        Update: {
          answers?:         Record<string, string>;
          score?:           number;
          heat?:            QualHeat;
          notes?:           string | null;
          suggested_reply?: string | null;
          next_action?:     string | null;
          created_by?:      string | null;
        };
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── Form submissions ──────────────────────────────────────────────────────────
export type FormType   = "landlord" | "investor" | "maintenance" | "website_app" | "ai_automation";
export type FormStatus = "new" | "reviewed" | "contacted" | "qualified" | "closed";

export interface FormSubmission {
  id:          string;
  created_at:  string;
  form_type:   FormType;
  contact_id:  string | null;
  data:        Record<string, unknown>;
  status:      FormStatus;
  notes:       string | null;
  assigned_to: string | null;
}

export type OutreachNiche =
  | "letting_agents" | "property_sourcers" | "developers"
  | "sa_operators" | "estate_agents" | "maintenance"
  | "ai_automation" | "website_app";

export type OutreachPlatform = "linkedin" | "email" | "whatsapp" | "facebook" | "instagram";
export type CampaignStatus   = "draft" | "active" | "paused" | "completed" | "archived";
export type LeadStatus       = "new" | "contacted" | "replied" | "interested" | "not_interested" | "booked" | "closed" | "ghosted" | "unqualified";
export type ReplyStatus      = "no_reply" | "replied" | "positive" | "negative" | "bounced" | "out_of_office";
export type OutreachActivityType = "note" | "email_sent" | "dm_sent" | "call" | "reply_received" | "status_change" | "follow_up_set" | "deal_closed" | "call_booked";

// ── Qualification convenience types ───────────────────────────────────────────

export interface QualificationTemplate {
  id: string;
  created_at: string;
  lead_type: QualLeadType;
  label: string;
  description: string | null;
  questions: QualQuestion[];
  heat_thresholds: QualHeatThresholds;
  reply_templates: QualReplyTemplates;
  next_actions: QualNextActions;
  crm_fields: string[];
  deal_fields: string[];
}

export interface QualificationSession {
  id: string;
  created_at: string;
  lead_type: QualLeadType;
  contact_id: string | null;
  conversation_id: string | null;
  answers: Record<string, string>;
  score: number;
  heat: QualHeat;
  notes: string | null;
  suggested_reply: string | null;
  next_action: string | null;
  created_by: string | null;
}
