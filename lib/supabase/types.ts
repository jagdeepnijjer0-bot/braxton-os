// Auto-maintained types mirroring the database schema.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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

export type ActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "status_change"
  | "follow_up_set"
  | "created";

// Supabase-js v2 requires each table to declare Relationships
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
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

      contact_activities: {
        Row: {
          id: string;
          contact_id: string;
          created_at: string;
          type: ActivityType;
          body: string;
          metadata: Json | null;
          created_by: string | null;
        };
        Insert: {
          contact_id: string;
          type: ActivityType;
          body: string;
          metadata?: Json | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_activities"]["Insert"]>;
      } & NoRelationships;

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
