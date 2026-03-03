/**
 * Supabase Database type definitions.
 * Manually defined to match the Supabase schema.
 * Can be replaced with auto-generated types via `supabase gen types typescript`.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          tier: 'free' | 'pro';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          tier?: 'free' | 'pro';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          tier?: 'free' | 'pro';
          updated_at?: string;
        };
        Relationships: [];
      };
      sprints: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          category: string | null;
          duration_days: number;
          start_date: string;
          end_date: string;
          status: 'active' | 'completed' | 'abandoned';
          calibration_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          category?: string | null;
          duration_days?: number;
          start_date: string;
          end_date: string;
          status?: 'active' | 'completed' | 'abandoned';
          calibration_done?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          category?: string | null;
          status?: 'active' | 'completed' | 'abandoned';
          calibration_done?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      sprint_rules: {
        Row: {
          id: string;
          sprint_id: string;
          user_id: string;
          title: string;
          type: 'binary' | 'numeric';
          target_value: number | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sprint_id: string;
          user_id: string;
          title: string;
          type: 'binary' | 'numeric';
          target_value?: number | null;
          position: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          type?: 'binary' | 'numeric';
          target_value?: number | null;
          position?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_checks: {
        Row: {
          id: string;
          sprint_id: string;
          rule_id: string;
          user_id: string;
          day_number: number;
          date: string;
          completed: boolean;
          value: number | null;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sprint_id: string;
          rule_id: string;
          user_id: string;
          day_number: number;
          date: string;
          completed?: boolean;
          value?: number | null;
          synced?: boolean;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          value?: number | null;
          synced?: boolean;
        };
        Relationships: [];
      };
      daily_entries: {
        Row: {
          id: string;
          sprint_id: string;
          user_id: string;
          day_number: number;
          date: string;
          content: string;
          synced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sprint_id: string;
          user_id: string;
          day_number: number;
          date: string;
          content: string;
          synced?: boolean;
          created_at?: string;
        };
        Update: {
          synced?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
