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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number | null
          campaign_name: string | null
          client_name: string
          created_at: string | null
          end_date: string
          id: string
          order_id: string | null
          panel_id: string
          payment_id: string | null
          start_date: string
          status: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          amount?: number | null
          campaign_name?: string | null
          client_name: string
          created_at?: string | null
          end_date: string
          id?: string
          order_id?: string | null
          panel_id: string
          payment_id?: string | null
          start_date: string
          status?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          amount?: number | null
          campaign_name?: string | null
          client_name?: string
          created_at?: string | null
          end_date?: string
          id?: string
          order_id?: string | null
          panel_id?: string
          payment_id?: string | null
          start_date?: string
          status?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "panels"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string | null
          department: string
          display_name: string
          geometry: Json
          id: string
          name: string
          province: string
        }
        Insert: {
          created_at?: string | null
          department: string
          display_name: string
          geometry: Json
          id?: string
          name: string
          province: string
        }
        Update: {
          created_at?: string | null
          department?: string
          display_name?: string
          geometry?: Json
          id?: string
          name?: string
          province?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          rejection_reason: string | null
          status: string | null
          total_amount: number
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          total_amount: number
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rejection_reason?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          default_currency: string | null
          id: string
          name: string
          plan_type: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          default_currency?: string | null
          id?: string
          name: string
          plan_type?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          default_currency?: string | null
          id?: string
          name?: string
          plan_type?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      panels: {
        Row: {
          audience: number | null
          base_price: number | null
          created_at: string | null
          currency: string | null
          daily_price: number | null
          face: string | null
          format: string | null
          height: number | null
          id: string
          max_slots: number | null
          media_type: string | null
          operating_end_time: string | null
          operating_start_time: string | null
          panel_code: string
          photo_url: string | null
          price_period: string | null
          resolution_height: number | null
          resolution_width: number | null
          slot_duration_seconds: number | null
          status: string | null
          structure_id: string
          traffic_view: string | null
          width: number | null
        }
        Insert: {
          audience?: number | null
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          daily_price?: number | null
          face?: string | null
          format?: string | null
          height?: number | null
          id?: string
          max_slots?: number | null
          media_type?: string | null
          operating_end_time?: string | null
          operating_start_time?: string | null
          panel_code: string
          photo_url?: string | null
          price_period?: string | null
          resolution_height?: number | null
          resolution_width?: number | null
          slot_duration_seconds?: number | null
          status?: string | null
          structure_id: string
          traffic_view?: string | null
          width?: number | null
        }
        Update: {
          audience?: number | null
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          daily_price?: number | null
          face?: string | null
          format?: string | null
          height?: number | null
          id?: string
          max_slots?: number | null
          media_type?: string | null
          operating_end_time?: string | null
          operating_start_time?: string | null
          panel_code?: string
          photo_url?: string | null
          price_period?: string | null
          resolution_height?: number | null
          resolution_width?: number | null
          slot_duration_seconds?: number | null
          status?: string | null
          structure_id?: string
          traffic_view?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "panels_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "structures"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          organization_id: string | null
          phone: string | null
          receipt_type: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          receipt_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          receipt_type?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_type?: string | null
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
      reclamos: {
        Row: {
          anio: number
          created_at: string
          descripcion_servicio: string
          detalle_reclamo: string
          estado: string
          fecha_respuesta: string | null
          id: string
          monto_reclamado: number | null
          numero_reclamo: string
          observaciones_empresa: string | null
          pedido_consumidor: string | null
          reclamante_domicilio: string
          reclamante_email: string
          reclamante_nombre: string
          reclamante_num_doc: string
          reclamante_telefono: string
          reclamante_tipo_doc: string
          respuesta_empresa: string | null
          secuencia: number
          tipo_bien: string
          tipo_disconformidad: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anio?: number
          created_at?: string
          descripcion_servicio: string
          detalle_reclamo: string
          estado?: string
          fecha_respuesta?: string | null
          id?: string
          monto_reclamado?: number | null
          numero_reclamo: string
          observaciones_empresa?: string | null
          pedido_consumidor?: string | null
          reclamante_domicilio: string
          reclamante_email: string
          reclamante_nombre: string
          reclamante_num_doc: string
          reclamante_telefono: string
          reclamante_tipo_doc: string
          respuesta_empresa?: string | null
          secuencia: number
          tipo_bien: string
          tipo_disconformidad: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anio?: number
          created_at?: string
          descripcion_servicio?: string
          detalle_reclamo?: string
          estado?: string
          fecha_respuesta?: string | null
          id?: string
          monto_reclamado?: number | null
          numero_reclamo?: string
          observaciones_empresa?: string | null
          pedido_consumidor?: string | null
          reclamante_domicilio?: string
          reclamante_email?: string
          reclamante_nombre?: string
          reclamante_num_doc?: string
          reclamante_telefono?: string
          reclamante_tipo_doc?: string
          respuesta_empresa?: string | null
          secuencia?: number
          tipo_bien?: string
          tipo_disconformidad?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      saved_campaigns: {
        Row: {
          campaign_name: string
          client_name: string
          created_at: string
          id: string
          items: Json
          total_amount: number
          user_id: string | null
        }
        Insert: {
          campaign_name: string
          client_name: string
          created_at?: string
          id?: string
          items: Json
          total_amount: number
          user_id?: string | null
        }
        Update: {
          campaign_name?: string
          client_name?: string
          created_at?: string
          id?: string
          items?: Json
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      structures: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          district: string | null
          id: string
          latitude: number | null
          longitude: number | null
          organization_id: string
          poi_details: Json | null
          poi_tags: string[] | null
          reference: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_id: string
          poi_details?: Json | null
          poi_tags?: string[] | null
          reference?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          district?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          organization_id: string
          poi_details?: Json | null
          poi_tags?: string[] | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions_log: {
        Row: {
          id: string
          ip_address: string | null
          logged_in_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          logged_in_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_gestor: { Args: never; Returns: boolean }
      sync_user_profile:
        | {
            Args: {
              p_document_number: string
              p_document_type: string
              p_email: string
              p_full_name: string
              p_phone: string
              p_receipt_type: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_document_number: string
              p_document_type: string
              p_email: string
              p_full_name: string
              p_phone: string
              p_receipt_type: string
              p_user_id: string
              p_user_type: string
            }
            Returns: undefined
          }
    }
    Enums: {
      user_role: "admin" | "user" | "gestor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "user", "gestor"],
    },
  },
} as const
