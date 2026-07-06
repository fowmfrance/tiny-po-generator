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
      article_types: {
        Row: {
          created_at: string
          default_unit_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_price_cap: boolean
          name: string
          organization_id: string
          supplier_type_id: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_unit_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_price_cap?: boolean
          name: string
          organization_id: string
          supplier_type_id: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_unit_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_price_cap?: boolean
          name?: string
          organization_id?: string
          supplier_type_id?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_types_supplier_type_id_fkey"
            columns: ["supplier_type_id"]
            isOneToOne: false
            referencedRelation: "supplier_types"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_connections: {
        Row: {
          bank_accounts: Json | null
          bank_name: string
          created_at: string
          encrypted_login: string
          encrypted_secret_key: string
          encryption_iv: string | null
          id: string
          is_active: boolean | null
          login: string
          organization_id: string
          organization_name: string | null
          secret_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_accounts?: Json | null
          bank_name: string
          created_at?: string
          encrypted_login: string
          encrypted_secret_key: string
          encryption_iv?: string | null
          id?: string
          is_active?: boolean | null
          login: string
          organization_id: string
          organization_name?: string | null
          secret_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_accounts?: Json | null
          bank_name?: string
          created_at?: string
          encrypted_login?: string
          encrypted_secret_key?: string
          encryption_iv?: string | null
          id?: string
          is_active?: boolean | null
          login?: string
          organization_id?: string
          organization_name?: string | null
          secret_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_label_mappings: {
        Row: {
          bank_label_id: string
          created_at: string
          expense_category_id: string | null
          id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_label_id: string
          created_at?: string
          expense_category_id?: string | null
          id?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_label_id?: string
          created_at?: string
          expense_category_id?: string | null
          id?: string
          organization_id?: string
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
          {
            foreignKeyName: "bank_label_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          article_type_id: string | null
          assignment_status: string | null
          budget_id: string
          completed_date: string | null
          completion_percentage: number
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          order_index: number
          organization_id: string
          supplier_id: string | null
          supplier_type_id: string | null
          supplier_type_id_original: string | null
          target_date: string
          title: string
          updated_at: string
        }
        Insert: {
          article_type_id?: string | null
          assignment_status?: string | null
          budget_id: string
          completed_date?: string | null
          completion_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          organization_id: string
          supplier_id?: string | null
          supplier_type_id?: string | null
          supplier_type_id_original?: string | null
          target_date: string
          title: string
          updated_at?: string
        }
        Update: {
          article_type_id?: string | null
          assignment_status?: string | null
          budget_id?: string
          completed_date?: string | null
          completion_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          order_index?: number
          organization_id?: string
          supplier_id?: string | null
          supplier_type_id?: string | null
          supplier_type_id_original?: string | null
          target_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_milestones_article_type_id_fkey"
            columns: ["article_type_id"]
            isOneToOne: false
            referencedRelation: "article_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_milestones_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_milestones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_milestones_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_milestones_supplier_type_id_fkey"
            columns: ["supplier_type_id"]
            isOneToOne: false
            referencedRelation: "supplier_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_milestones_supplier_type_id_original_fkey"
            columns: ["supplier_type_id_original"]
            isOneToOne: false
            referencedRelation: "supplier_types"
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          po_format?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          budget_type_id: string
          client_id: string | null
          code: string
          completion_percentage: number
          created_at: string
          currency: string
          end_date: string | null
          expense_types: string[] | null
          id: string
          initial_amount: number
          milestone_mode: string | null
          name: string
          organization_id: string
          project_manager_id: string | null
          recognition_method_id: string | null
          resale_price: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_type_id: string
          client_id?: string | null
          code: string
          completion_percentage?: number
          created_at?: string
          currency?: string
          end_date?: string | null
          expense_types?: string[] | null
          id?: string
          initial_amount?: number
          milestone_mode?: string | null
          name: string
          organization_id: string
          project_manager_id?: string | null
          recognition_method_id?: string | null
          resale_price?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_type_id?: string
          client_id?: string | null
          code?: string
          completion_percentage?: number
          created_at?: string
          currency?: string
          end_date?: string | null
          expense_types?: string[] | null
          id?: string
          initial_amount?: number
          milestone_mode?: string | null
          name?: string
          organization_id?: string
          project_manager_id?: string | null
          recognition_method_id?: string | null
          resale_price?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_recognition_method_id_fkey"
            columns: ["recognition_method_id"]
            isOneToOne: false
            referencedRelation: "recognition_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_purchase_orders: {
        Row: {
          amount_allocated: number
          created_at: string
          id: string
          invoice_id: string
          organization_id: string
          purchase_order_id: string
        }
        Insert: {
          amount_allocated?: number
          created_at?: string
          id?: string
          invoice_id: string
          organization_id: string
          purchase_order_id: string
        }
        Update: {
          amount_allocated?: number
          created_at?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_purchase_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_purchase_orders_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_document_types: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyc_level_requirements: {
        Row: {
          created_at: string
          document_type_id: string
          id: string
          is_mandatory: boolean
          kyc_level_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          id?: string
          is_mandatory?: boolean
          kyc_level_id: string
          organization_id: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          id?: string
          is_mandatory?: boolean
          kyc_level_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_level_requirements_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "kyc_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_level_requirements_kyc_level_id_fkey"
            columns: ["kyc_level_id"]
            isOneToOne: false
            referencedRelation: "kyc_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kyc_level_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_levels: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_default: boolean
          name: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_levels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_confirmations_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "budget_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_confirmations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          max_users: number
          name: string
          plan: string
          siret: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          max_users?: number
          name: string
          plan?: string
          siret?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          max_users?: number
          name?: string
          plan?: string
          siret?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_batch_invoices: {
        Row: {
          amount_paid: number
          batch_id: string
          created_at: string
          id: string
          invoice_id: string
          organization_id: string
        }
        Insert: {
          amount_paid: number
          batch_id: string
          created_at?: string
          id?: string
          invoice_id: string
          organization_id: string
        }
        Update: {
          amount_paid?: number
          batch_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          organization_id?: string
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
          {
            foreignKeyName: "payment_batch_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          sepa_xml?: string | null
          status?: string
          submitted_at?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_modalities: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          payment_method_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          payment_method_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          payment_method_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_modalities_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          receive_email_copies: boolean
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          receive_email_copies?: boolean
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          receive_email_copies?: boolean
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
      purchase_order_items: {
        Row: {
          article_type_id: string | null
          created_at: string
          description: string
          id: string
          organization_id: string
          purchase_order_id: string
          quantity: number
          total: number | null
          unit_price: number
        }
        Insert: {
          article_type_id?: string | null
          created_at?: string
          description: string
          id?: string
          organization_id: string
          purchase_order_id: string
          quantity?: number
          total?: number | null
          unit_price?: number
        }
        Update: {
          article_type_id?: string | null
          created_at?: string
          description?: string
          id?: string
          organization_id?: string
          purchase_order_id?: string
          quantity?: number
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_article_type_id_fkey"
            columns: ["article_type_id"]
            isOneToOne: false
            referencedRelation: "article_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_id: string | null
          created_at: string
          currency: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          organization_id: string
          po_number: string
          sent_at: string | null
          status: string
          supplier_id: string | null
          supplier_name: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          created_at?: string
          currency?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          po_number: string
          sent_at?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string | null
          created_at?: string
          currency?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          po_number?: string
          sent_at?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
      supplier_access_tokens: {
        Row: {
          created_at: string
          created_by: string
          email_verified: boolean
          id: string
          is_active: boolean
          organization_id: string
          supplier_id: string
          token: string
          updated_at: string
          verification_code: string | null
          verification_code_expires_at: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email_verified?: boolean
          id?: string
          is_active?: boolean
          organization_id: string
          supplier_id: string
          token?: string
          updated_at?: string
          verification_code?: string | null
          verification_code_expires_at?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email_verified?: boolean
          id?: string
          is_active?: boolean
          organization_id?: string
          supplier_id?: string
          token?: string
          updated_at?: string
          verification_code?: string | null
          verification_code_expires_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_access_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_access_tokens_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_agreements: {
        Row: {
          attachment_url: string | null
          created_at: string
          currency: string
          end_date: string
          id: string
          organization_id: string
          signed_at: string | null
          signed_by: string | null
          start_date: string
          status: string
          supplier_id: string
          terms: string | null
          title: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          currency?: string
          end_date: string
          id?: string
          organization_id: string
          signed_at?: string | null
          signed_by?: string | null
          start_date: string
          status?: string
          supplier_id: string
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          currency?: string
          end_date?: string
          id?: string
          organization_id?: string
          signed_at?: string | null
          signed_by?: string | null
          start_date?: string
          status?: string
          supplier_id?: string
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_agreements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_agreements_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          supplier_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_bank_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_primary: boolean | null
          last_name: string
          notes: string | null
          organization_id: string
          phone: string | null
          role: string | null
          supplier_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_primary?: boolean | null
          last_name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          role?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_primary?: boolean | null
          last_name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role?: string | null
          supplier_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contacts_supplier_id_fkey"
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
          organization_id: string
          paid_date: string | null
          po_number: string | null
          project_code: string | null
          purchase_order_id: string | null
          received_date: string
          status: string
          supplier_id: string | null
          supplier_name: string | null
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
          organization_id: string
          paid_date?: string | null
          po_number?: string | null
          project_code?: string | null
          purchase_order_id?: string | null
          received_date?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
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
          organization_id?: string
          paid_date?: string | null
          po_number?: string | null
          project_code?: string | null
          purchase_order_id?: string | null
          received_date?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          updated_at?: string
          user_id?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_kyc_documents: {
        Row: {
          created_at: string
          document_type_id: string
          file_url: string
          id: string
          notes: string | null
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supplier_id: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          file_url: string
          id?: string
          notes?: string | null
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          file_url?: string
          id?: string
          notes?: string | null
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_kyc_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "kyc_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_kyc_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_kyc_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          organization_id: string
          po_id: string | null
          rating: number
          service_date: string | null
          supplier_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          organization_id: string
          po_id?: string | null
          rating: number
          service_date?: string | null
          supplier_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          po_id?: string | null
          rating?: number
          service_date?: string | null
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_ratings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_ratings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_types: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_volume: number | null
          city: string | null
          code_auxiliaire: string | null
          country: string | null
          created_at: string
          default_payment_method_id: string | null
          default_payment_modality_id: string | null
          email: string
          has_negotiated_rates: boolean | null
          id: string
          is_active: boolean | null
          is_po_exempt: boolean
          kyc_level_id: string | null
          kyc_status: string
          name: string
          organization_id: string
          phone: string | null
          siren: string | null
          specialty: string | null
          supplier_type_id: string | null
          tax_id: string | null
          updated_at: string
          url: string | null
          user_id: string
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          business_volume?: number | null
          city?: string | null
          code_auxiliaire?: string | null
          country?: string | null
          created_at?: string
          default_payment_method_id?: string | null
          default_payment_modality_id?: string | null
          email: string
          has_negotiated_rates?: boolean | null
          id?: string
          is_active?: boolean | null
          is_po_exempt?: boolean
          kyc_level_id?: string | null
          kyc_status?: string
          name: string
          organization_id: string
          phone?: string | null
          siren?: string | null
          specialty?: string | null
          supplier_type_id?: string | null
          tax_id?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          business_volume?: number | null
          city?: string | null
          code_auxiliaire?: string | null
          country?: string | null
          created_at?: string
          default_payment_method_id?: string | null
          default_payment_modality_id?: string | null
          email?: string
          has_negotiated_rates?: boolean | null
          id?: string
          is_active?: boolean | null
          is_po_exempt?: boolean
          kyc_level_id?: string | null
          kyc_status?: string
          name?: string
          organization_id?: string
          phone?: string | null
          siren?: string | null
          specialty?: string | null
          supplier_type_id?: string | null
          tax_id?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_default_payment_method_id_fkey"
            columns: ["default_payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_default_payment_modality_id_fkey"
            columns: ["default_payment_modality_id"]
            isOneToOne: false
            referencedRelation: "payment_modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_kyc_level_id_fkey"
            columns: ["kyc_level_id"]
            isOneToOne: false
            referencedRelation: "kyc_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_supplier_type_id_fkey"
            columns: ["supplier_type_id"]
            isOneToOne: false
            referencedRelation: "supplier_types"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          bank_connection_id: string | null
          created_at: string
          id: string
          organization_id: string
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
          organization_id: string
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
          organization_id?: string
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
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      current_user_organization_id: { Args: never; Returns: string }
      decrypt_credential: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
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
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      initialize_default_supplier_types: {
        Args: { _user_id: string }
        Returns: undefined
      }
      initialize_default_teams: {
        Args: { _user_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
