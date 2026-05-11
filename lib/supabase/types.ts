// Auto-maintained types that mirror the database schema.
// When you add columns to the DB, update the matching Row/Insert/Update types here.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

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
      };

      companies: {
        Row: {
          id: string;
          name: string;
          domain: string | null;
          industry: string | null;
          size: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["companies"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
      };

      contacts: {
        Row: {
          id: string;
          company_id: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          role: string | null;
          status: "lead" | "prospect" | "customer" | "churned";
          owner_id: string | null;
          last_contacted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contacts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["contacts"]["Insert"]>;
      };

      deals: {
        Row: {
          id: string;
          name: string;
          contact_id: string | null;
          company_id: string | null;
          owner_id: string | null;
          stage: "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
          value: number | null;
          priority: "low" | "medium" | "high";
          close_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };

      deal_tasks: {
        Row: {
          id: string;
          deal_id: string;
          title: string;
          completed: boolean;
          due_date: string | null;
          assigned_to: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["deal_tasks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["deal_tasks"]["Insert"]>;
      };

      conversations: {
        Row: {
          id: string;
          contact_id: string | null;
          subject: string | null;
          status: "open" | "closed" | "snoozed";
          channel: "email" | "linkedin" | "phone" | "other";
          assigned_to: string | null;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["conversations"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          body: string;
          direction: "inbound" | "outbound";
          read: boolean;
          sent_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["messages"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
      };

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
        Insert: Omit<Database["public"]["Tables"]["outreach_campaigns"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["outreach_campaigns"]["Insert"]>;
      };

      outreach_leads: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string | null;
          status: "pending" | "sent" | "opened" | "replied" | "bounced" | "unsubscribed";
          step: number;
          sent_at: string | null;
          opened_at: string | null;
          replied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["outreach_leads"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["outreach_leads"]["Insert"]>;
      };

      notes: {
        Row: {
          id: string;
          body: string;
          author_id: string | null;
          contact_id: string | null;
          deal_id: string | null;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
