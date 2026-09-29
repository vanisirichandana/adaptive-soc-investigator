export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          actor_user: string | null
          category: string | null
          created_at: string
          description: string | null
          destination: string | null
          device: string | null
          id: string
          initial_hypothesis: string | null
          metadata: Json
          organization_id: string | null
          ref: string
          risk_score: number
          severity: string
          source: string | null
          source_ip: string | null
          status: string
          title: string
        }
        Insert: {
          actor_user?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          device?: string | null
          id?: string
          initial_hypothesis?: string | null
          metadata?: Json
          organization_id?: string | null
          ref: string
          risk_score?: number
          severity?: string
          source?: string | null
          source_ip?: string | null
          status?: string
          title: string
        }
        Update: {
          actor_user?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          destination?: string | null
          device?: string | null
          id?: string
          initial_hypothesis?: string | null
          metadata?: Json
          organization_id?: string | null
          ref?: string
          risk_score?: number
          severity?: string
          source?: string | null
          source_ip?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analyst_decisions: {
        Row: {
          analyst_id: string
          created_at: string
          decision: string
          final_hypothesis: string | null
          id: string
          investigation_id: string
          original_hypothesis: string | null
          reason: string
        }
        Insert: {
          analyst_id: string
          created_at?: string
          decision: string
          final_hypothesis?: string | null
          id?: string
          investigation_id: string
          original_hypothesis?: string | null
          reason: string
        }
        Update: {
          analyst_id?: string
          created_at?: string
          decision?: string
          final_hypothesis?: string | null
          id?: string
          investigation_id?: string
          original_hypothesis?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyst_decisions_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          description: string | null
          entity: string | null
          entity_id: string | null
          id: string
          investigation_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          description?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          investigation_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          description?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          investigation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_events: {
        Row: {
          alert_id: string
          created_at: string
          detail: string | null
          event_type: string | null
          id: string
          label: string
          occurred_at: string
          sequence: number
          severity: string | null
        }
        Insert: {
          alert_id: string
          created_at?: string
          detail?: string | null
          event_type?: string | null
          id?: string
          label: string
          occurred_at?: string
          sequence?: number
          severity?: string | null
        }
        Update: {
          alert_id?: string
          created_at?: string
          detail?: string | null
          event_type?: string | null
          id?: string
          label?: string
          occurred_at?: string
          sequence?: number
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_events_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      hindsight_experiences: {
        Row: {
          analyst_decision: string | null
          created_at: string
          evidence_pattern: string[]
          hindsight_remote_id: string | null
          id: string
          investigation_type: string
          outcome: string | null
          ref: string
          source_investigation_id: string | null
          summary: string
        }
        Insert: {
          analyst_decision?: string | null
          created_at?: string
          evidence_pattern?: string[]
          hindsight_remote_id?: string | null
          id?: string
          investigation_type: string
          outcome?: string | null
          ref: string
          source_investigation_id?: string | null
          summary: string
        }
        Update: {
          analyst_decision?: string | null
          created_at?: string
          evidence_pattern?: string[]
          hindsight_remote_id?: string | null
          id?: string
          investigation_type?: string
          outcome?: string | null
          ref?: string
          source_investigation_id?: string | null
          summary?: string
        }
        Relationships: []
      }
      hindsight_recalls: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          investigation_id: string
          rationale: string | null
          similarity: number
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          investigation_id: string
          rationale?: string | null
          similarity?: number
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          investigation_id?: string
          rationale?: string | null
          similarity?: number
        }
        Relationships: [
          {
            foreignKeyName: "hindsight_recalls_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "hindsight_experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hindsight_recalls_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      hypotheses: {
        Row: {
          confidence: number | null
          created_at: string
          id: string
          investigation_id: string
          reasoning: string | null
          source: string
          stage: string
          statement: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          id?: string
          investigation_id: string
          reasoning?: string | null
          source?: string
          stage?: string
          statement: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          id?: string
          investigation_id?: string
          reasoning?: string | null
          source?: string
          stage?: string
          statement?: string
        }
        Relationships: [
          {
            foreignKeyName: "hypotheses_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_outcomes: {
        Row: {
          analyst_id: string
          created_at: string
          id: string
          investigation_id: string
          notes: string | null
          outcome: string
        }
        Insert: {
          analyst_id: string
          created_at?: string
          id?: string
          investigation_id: string
          notes?: string | null
          outcome: string
        }
        Update: {
          analyst_id?: string
          created_at?: string
          id?: string
          investigation_id?: string
          notes?: string | null
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_outcomes_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigations: {
        Row: {
          ai_state: string
          alert_id: string
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          confidence: number | null
          created_at: string
          hindsight_experience_id: string | null
          id: string
          opened_at: string
          ref: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_state?: string
          alert_id: string
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          hindsight_experience_id?: string | null
          id?: string
          opened_at?: string
          ref: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_state?: string
          alert_id?: string
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          confidence?: number | null
          created_at?: string
          hindsight_experience_id?: string | null
          id?: string
          opened_at?: string
          ref?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigations_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          organization_id: string | null
          organization_name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          organization_id?: string | null
          organization_name?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          organization_name?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
