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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bank_connections: {
        Row: {
          bank_accounts: Json | null
          bank_name: string
          created_at: string
          encrypted_login: string | null
          encrypted_secret_key: string | null
          encryption_iv: string | null
          id: string
          is_active: boolean | null
          login: string
          organization_name: string | null
          secret_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_accounts?: Json | null
          bank_name: string
          created_at?: string
          encrypted_login?: string | null
          encrypted_secret_key?: string | null
          encryption_iv?: string | null
          id?: string
          is_active?: boolean | null
          login: string
          organization_name?: string | null
          secret_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_accounts?: Json | null
          bank_name?: string
          created_at?: string
          encrypted_login?: string | null
          encrypted_secret_key?: string | null
          encryption_iv?: string | null
          id?: string
          is_active?: boolean | null
          login?: string
          organization_name?: string | null
          secret_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_label_mappings: {
        Row: {
          bank_label_id: string
          created_at: string
          expense_category_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_label_id: string
          created_at?: string
          expense_category_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_label_id?: string
          created_at?: string
          expense_category_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_label_mappings_bank_label_id_fkey"
            columns: ["bank_label_id"]
            isOneToOne: false
            referencedRelation: "bank_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_label_mappings_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_labels: {
        Row: {
          bank_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          label_code: string
          label_name: string
        }
        Insert: {
          bank_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label_code: string
          label_name: string
        }
        Update: {
          bank_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          label_code?: string
          label_name?: string
        }
        Relationships: []
      }
      budget_milestones: {
        Row: {
          budget_id: string
          completed_date: string | null
          completion_percentage: number
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          order_index: number
          target_date: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_id: string
          completed_date?: string | null
          completion_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          target_date: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_id?: string
          completed_date?: string | null
          completion_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          target_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_milestones_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_types: {
        Row: {
          created_at: string
          current_sequence: number
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          po_format: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_sequence?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          po_format?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_sequence?: number
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          po_format?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          budget_type_id: string
          code: string
          created_at: string
          currency: string
          end_date: string | null
          expense_types: string[] | null
          id: string
          initial_amount: number
          name: string
          recognition_method_id: string | null
          resale_price: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_type_id: string
          code: string
          created_at?: string
          currency?: string
          end_date?: string | null
          expense_types?: string[] | null
          id?: string
          initial_amount?: number
          name: string
          recognition_method_id?: string | null
          resale_price?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_type_id?: string
          code?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          expense_types?: string[] | null
          id?: string
          initial_amount?: number
          name?: string
          recognition_method_id?: string | null
          resale_price?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_recognition_method_id_fkey"
            columns: ["recognition_method_id"]
            isOneToOne: false
            referencedRelation: "recognition_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      milestone_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by: string
          created_at: string
          id: string
          is_on_time: boolean
          milestone_id: string
          new_target_date: string | null
          notes: string | null
        }
        Insert: {
          confirmed_at?: string
          confirmed_by: string
          created_at?: string
          id?: string
          is_on_time?: boolean
          milestone_id: string
          new_target_date?: string | null
          notes?: string | null
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string
          created_at?: string
          id?: string
          is_on_time?: boolean
          milestone_id?: string
          new_target_date?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_confirmations_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "budget_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batch_invoices: {
        Row: {
          amount_paid: number
          batch_id: string
          created_at: string
          id: string
          invoice_id: string
        }
        Insert: {
          amount_paid: number
          batch_id: string
          created_at?: string
          id?: string
          invoice_id: string
        }
        Update: {
          amount_paid?: number
          batch_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_batch_invoices_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          batch_reference: string
          created_at: string
          currency: string
          generated_at: string | null
          id: string
          invoice_count: number
          notes: string | null
          sepa_xml: string | null
          status: string
          submitted_at: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          batch_reference: string
          created_at?: string
          currency?: string
          generated_at?: string | null
          id?: string
          invoice_count: number
          notes?: string | null
          sepa_xml?: string | null
          status?: string
          submitted_at?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          batch_reference?: string
          created_at?: string
          currency?: string
          generated_at?: string | null
          id?: string
          invoice_count?: number
          notes?: string | null
          sepa_xml?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recognition_methods: {
        Row: {
          code: string
          created_at: string
          description: string
          display_order: number
          example: string | null
          formula_expense: string | null
          formula_revenue: string | null
          id: string
          ifrs15_justification: string | null
          is_active: boolean | null
          is_system: boolean | null
          name_expense: string
          name_revenue: string
          relation_type: string
          trigger_type: string
          updated_at: string
          use_cases: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          display_order?: number
          example?: string | null
          formula_expense?: string | null
          formula_revenue?: string | null
          id?: string
          ifrs15_justification?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          name_expense: string
          name_revenue: string
          relation_type?: string
          trigger_type: string
          updated_at?: string
          use_cases?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          display_order?: number
          example?: string | null
          formula_expense?: string | null
          formula_revenue?: string | null
          id?: string
          ifrs15_justification?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          name_expense?: string
          name_revenue?: string
          relation_type?: string
          trigger_type?: string
          updated_at?: string
          use_cases?: string | null
        }
        Relationships: []
      }
      supplier_bank_accounts: {
        Row: {
          archived_at: string | null
          archived_reason: string | null
          bank_name: string | null
          created_at: string
          currency: string
          encrypted_bic: string
          encrypted_iban: string
          id: string
          is_archived: boolean | null
          is_primary: boolean | null
          label: string
          supplier_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_reason?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          encrypted_bic: string
          encrypted_iban: string
          id?: string
          is_archived?: boolean | null
          is_primary?: boolean | null
          label: string
          supplier_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_reason?: string | null
          bank_name?: string | null
          created_at?: string
          currency?: string
          encrypted_bic?: string
          encrypted_iban?: string
          id?: string
          is_archived?: boolean | null
          is_primary?: boolean | null
          label?: string
          supplier_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_bank_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          amount: number
          attachment_url: string | null
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_date: string | null
          po_number: string | null
          project_code: string | null
          received_date: string
          status: string
          supplier_id: string
          updated_at: string
          user_id: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          paid_date?: string | null
          po_number?: string | null
          project_code?: string | null
          received_date?: string
          status?: string
          supplier_id: string
          updated_at?: string
          user_id: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_date?: string | null
          po_number?: string | null
          project_code?: string | null
          received_date?: string
          status?: string
          supplier_id?: string
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          bank_connection_id: string | null
          created_at: string
          id: string
          project_code: string | null
          qonto_amount: number
          qonto_attachment_ids: Json | null
          qonto_card_last_digits: string | null
          qonto_category: string | null
          qonto_currency: string | null
          qonto_emitted_at: string | null
          qonto_initiator_id: string | null
          qonto_label: string | null
          qonto_local_amount: number | null
          qonto_local_currency: string | null
          qonto_note: string | null
          qonto_operation_type: string | null
          qonto_raw_data: Json | null
          qonto_reference: string | null
          qonto_settled_at: string | null
          qonto_side: string | null
          qonto_status: string | null
          qonto_transaction_id: string
          qonto_vat_amount: number | null
          qonto_vat_rate: number | null
          sapajoo_category_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_connection_id?: string | null
          created_at?: string
          id?: string
          project_code?: string | null
          qonto_amount: number
          qonto_attachment_ids?: Json | null
          qonto_card_last_digits?: string | null
          qonto_category?: string | null
          qonto_currency?: string | null
          qonto_emitted_at?: string | null
          qonto_initiator_id?: string | null
          qonto_label?: string | null
          qonto_local_amount?: number | null
          qonto_local_currency?: string | null
          qonto_note?: string | null
          qonto_operation_type?: string | null
          qonto_raw_data?: Json | null
          qonto_reference?: string | null
          qonto_settled_at?: string | null
          qonto_side?: string | null
          qonto_status?: string | null
          qonto_transaction_id: string
          qonto_vat_amount?: number | null
          qonto_vat_rate?: number | null
          sapajoo_category_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_connection_id?: string | null
          created_at?: string
          id?: string
          project_code?: string | null
          qonto_amount?: number
          qonto_attachment_ids?: Json | null
          qonto_card_last_digits?: string | null
          qonto_category?: string | null
          qonto_currency?: string | null
          qonto_emitted_at?: string | null
          qonto_initiator_id?: string | null
          qonto_label?: string | null
          qonto_local_amount?: number | null
          qonto_local_currency?: string | null
          qonto_note?: string | null
          qonto_operation_type?: string | null
          qonto_raw_data?: Json | null
          qonto_reference?: string | null
          qonto_settled_at?: string | null
          qonto_side?: string | null
          qonto_status?: string | null
          qonto_transaction_id?: string
          qonto_vat_amount?: number | null
          qonto_vat_rate?: number | null
          sapajoo_category_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_connection_id_fkey"
            columns: ["bank_connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sapajoo_category_id_fkey"
            columns: ["sapajoo_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_supplier_bank_account: {
        Args: { p_bank_account_id: string; p_reason: string }
        Returns: undefined
      }
      create_encrypted_bank_connection: {
        Args: {
          p_bank_accounts: Json
          p_bank_name: string
          p_encrypted_login: string
          p_encrypted_secret_key: string
          p_organization_name: string
        }
        Returns: string
      }
      decrypt_credential: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      encrypt_credential: {
        Args: { encryption_key: string; iv: string; plain_text: string }
        Returns: string
      }
      encrypt_supplier_bank_account: {
        Args: {
          p_bank_name: string
          p_bic: string
          p_currency: string
          p_encryption_key: string
          p_iban: string
          p_is_primary: boolean
          p_label: string
          p_supplier_id: string
        }
        Returns: string
      }
      get_decrypted_credentials: {
        Args: { p_connection_id: string; p_encryption_key: string }
        Returns: {
          decrypted_login: string
          decrypted_secret_key: string
        }[]
      }
      get_decrypted_supplier_bank: {
        Args: { p_bank_account_id: string; p_encryption_key: string }
        Returns: {
          decrypted_bic: string
          decrypted_iban: string
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      initialize_default_budget_types: {
        Args: { _user_id: string }
        Returns: undefined
      }
      initialize_default_categories: {
        Args: { _user_id: string }
        Returns: undefined
      }
      initialize_default_teams: {
        Args: { _user_id: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
