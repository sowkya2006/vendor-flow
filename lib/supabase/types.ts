export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Enum helpers
// ---------------------------------------------------------------------------
export type VendorStatus   = 'active' | 'inactive' | 'pending' | 'suspended'
export type VendorCategory =
  | 'software' | 'hardware' | 'services' | 'consulting'
  | 'logistics' | 'marketing' | 'finance' | 'legal' | 'other'
export type ContractType   = 'fixed' | 'time_and_materials' | 'retainer' | 'milestone' | 'other'
export type PaymentTerms   = 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'net_90' | 'immediate' | 'other'
export type DocumentType   =
  | 'contract' | 'nda' | 'sow' | 'invoice' | 'insurance'
  | 'compliance' | 'certificate' | 'other'
export type RfqStatus      = 'draft' | 'sent' | 'under_review' | 'awarded' | 'cancelled' | 'pending_approval' | 'approved' | 'rejected'
export type RfqPriority    = 'low' | 'medium' | 'high' | 'urgent'
export type PoStatus       =
  | 'draft' | 'pending_approval' | 'approved' | 'sent'
  | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled'
export type QuotationStatus =
  | 'draft' | 'submitted' | 'under_review' | 'shortlisted'
  | 'approved' | 'rejected' | 'expired' | 'selected' | 'closed' | 'withdrawn'
export type InvoiceStatus  = 'draft' | 'submitted' | 'approved' | 'partially_paid' | 'paid' | 'cancelled'
export type PaymentMethod  = 'bank_transfer' | 'upi' | 'cheque' | 'cash' | 'card'
export type UserRole =
  | 'administrator' | 'admin'
  | 'procurement_manager' | 'procurement_officer'
  | 'warehouse_manager' | 'finance_manager'
  | 'vendor' | 'member' | 'viewer'
export type UserStatus = 'active' | 'inactive' | 'invited' | 'suspended'
export type ApprovalRequestStatus =
  | 'draft' | 'pending_manager' | 'pending_procurement' | 'pending_finance'
  | 'pending_final' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'returned'
export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'skipped'
export type ApprovalEntityType = 'vendor' | 'rfq' | 'quotation' | 'purchase_order' | 'contract' | 'invoice'
export type ApprovalActionType =
  | 'submitted' | 'approved' | 'rejected' | 'returned' | 'cancelled'
  | 'reassigned' | 'escalated' | 'commented' | 'reopened'
export type InventoryTransactionType =
  | 'stock_in' | 'stock_out' | 'adjustment' | 'grn' | 'reservation' | 'reservation_release'
export type ProductStatus = 'active' | 'inactive' | 'discontinued'
export type GrnStatus     = 'draft' | 'completed' | 'cancelled'
export type CollaborationRequestStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

// ---------------------------------------------------------------------------
// Database shape (used by the Supabase client generic)
// ---------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      // ── companies ────────────────────────────────────────────────────────
      companies: {
        Row: {
          id:              string
          name:            string
          domain:          string | null
          logo_url:        string | null
          address:         string | null
          phone:           string | null
          website:         string | null
          industry:        string | null
          size:            string | null
          workspace_name:  string | null
          gst_number:      string | null
          timezone:        string | null
          setup_complete:  boolean
          created_at:      string
          updated_at:      string
        }
        Insert: {
          id?:             string
          name:            string
          domain?:         string | null
          logo_url?:       string | null
          address?:        string | null
          phone?:          string | null
          website?:        string | null
          industry?:       string | null
          size?:           string | null
          workspace_name?: string | null
          gst_number?:     string | null
          timezone?:       string | null
          setup_complete?: boolean
          created_at?:     string
          updated_at?:     string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }

      // ── users ─────────────────────────────────────────────────────────────
      users: {
        Row: {
          id:           string
          company_id:   string
          full_name:    string | null
          email:        string | null
          role:         UserRole
          avatar_url:   string | null
          department:   string | null
          designation:  string | null
          phone:        string | null
          status:       UserStatus
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id:            string
          company_id:    string
          full_name?:    string | null
          email?:        string | null
          role?:         UserRole
          avatar_url?:   string | null
          department?:   string | null
          designation?:  string | null
          phone?:        string | null
          status?:       UserStatus
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['users']['Insert'], 'id'>>
      }

      // ── categories ────────────────────────────────────────────────────────
      categories: {
        Row: {
          id:           string
          company_id:   string
          name:         string
          description:  string | null
          color:        string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          name:          string
          description?:  string | null
          color?:        string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['categories']['Insert'], 'company_id'>>
      }

      // ── vendors ───────────────────────────────────────────────────────────
      vendors: {
        Row: {
          id:                   string
          company_id:           string
          name:                 string
          legal_name:           string | null
          email:                string | null
          phone:                string | null
          website:              string | null
          address:              string | null
          category:             VendorCategory | null
          status:               VendorStatus
          tax_id:               string | null
          registration_number:  string | null
          description:          string | null
          notes:                string | null
          contract_start_date:  string | null
          contract_end_date:    string | null
          contract_value:       number | null
          contract_type:        ContractType | null
          payment_terms:        PaymentTerms | null
          currency:             string | null
          created_by:           string | null
          created_at:           string
          updated_at:           string
          vendor_company_id?:   string | null
        }
        Insert: {
          id?:                   string
          company_id:            string
          name:                  string
          legal_name?:           string | null
          email?:                string | null
          phone?:                string | null
          website?:              string | null
          address?:              string | null
          category?:             VendorCategory | null
          status?:               VendorStatus
          tax_id?:               string | null
          registration_number?:  string | null
          description?:          string | null
          notes?:                string | null
          contract_start_date?:  string | null
          contract_end_date?:    string | null
          contract_value?:       number | null
          contract_type?:        ContractType | null
          payment_terms?:        PaymentTerms | null
          currency?:             string | null
          created_by?:           string | null
          created_at?:           string
          updated_at?:           string
        }
        Update: Partial<Omit<Database['public']['Tables']['vendors']['Insert'], 'company_id'>>
      }

      // ── vendor_contacts ───────────────────────────────────────────────────
      vendor_contacts: {
        Row: {
          id:          string
          vendor_id:   string
          company_id:  string
          first_name:  string
          last_name:   string | null
          title:       string | null
          email:       string | null
          phone:       string | null
          is_primary:  boolean
          notes:       string | null
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:          string
          vendor_id:    string
          company_id:   string
          first_name:   string
          last_name?:   string | null
          title?:       string | null
          email?:       string | null
          phone?:       string | null
          is_primary?:  boolean
          notes?:       string | null
          created_at?:  string
          updated_at?:  string
        }
        Update: Partial<Omit<Database['public']['Tables']['vendor_contacts']['Insert'], 'vendor_id' | 'company_id'>>
      }

      // ── vendor_documents ──────────────────────────────────────────────────
      vendor_documents: {
        Row: {
          id:             string
          vendor_id:      string
          company_id:     string
          uploaded_by:    string | null
          name:           string
          document_type:  DocumentType
          storage_path:   string
          file_size:      number | null
          mime_type:      string | null
          expiry_date:    string | null
          notes:          string | null
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:             string
          vendor_id:       string
          company_id:      string
          uploaded_by?:    string | null
          name:            string
          document_type?:  DocumentType
          storage_path:    string
          file_size?:      number | null
          mime_type?:      string | null
          expiry_date?:    string | null
          notes?:          string | null
          created_at?:     string
          updated_at?:     string
        }
        Update: Partial<Omit<Database['public']['Tables']['vendor_documents']['Insert'], 'vendor_id' | 'company_id'>>
      }

      // ── rfqs ──────────────────────────────────────────────────────────────
      rfqs: {
        Row: {
          id:           string
          company_id:   string
          rfq_number:   string
          title:        string
          description:  string | null
          vendor_id:    string
          status:       RfqStatus
          priority:     RfqPriority
          due_date:     string | null
          terms:        string | null
          created_by:   string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          rfq_number?:   string
          title:         string
          description?:  string | null
          vendor_id:     string
          status?:       RfqStatus
          priority?:     RfqPriority
          due_date?:     string | null
          terms?:        string | null
          created_by?:   string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['rfqs']['Insert'], 'company_id'>>
      }

      // ── rfq_items ─────────────────────────────────────────────────────────
      rfq_items: {
        Row: {
          id:                     string
          rfq_id:                 string
          description:            string
          quantity:               number
          unit:                   string
          estimated_unit_price:   number | null
          created_at:             string
        }
        Insert: {
          id?:                     string
          rfq_id:                  string
          description:             string
          quantity?:               number
          unit?:                   string
          estimated_unit_price?:   number | null
          created_at?:             string
        }
        Update: Partial<Omit<Database['public']['Tables']['rfq_items']['Insert'], 'rfq_id'>>
      }

      // ── quotations ────────────────────────────────────────────────────────
      quotations: {
        Row: {
          id:                 string
          company_id:         string
          rfq_id:             string
          vendor_id:          string
          quotation_number:   string
          status:             QuotationStatus
          subtotal:           number
          discount_type:      string | null
          discount_value:     number
          discount_amount:    number
          tax_amount:         number
          grand_total:        number
          delivery_days:      number | null
          lead_time_days:     number | null
          warranty_months:    number | null
          payment_terms:      string | null
          validity_date:      string | null
          notes:              string | null
          rejection_reason:   string | null
          submitted_at:       string | null
          reviewed_at:        string | null
          approved_at:        string | null
          rejected_at:        string | null
          created_by:         string | null
          updated_by:         string | null
          created_at:         string
          updated_at:         string
        }
        Insert: {
          id?:                 string
          company_id:          string
          rfq_id:              string
          vendor_id:           string
          quotation_number:    string
          status?:             QuotationStatus
          subtotal?:           number
          discount_type?:      string | null
          discount_value?:     number
          discount_amount?:    number
          tax_amount?:         number
          grand_total?:        number
          delivery_days?:      number | null
          lead_time_days?:     number | null
          warranty_months?:    number | null
          payment_terms?:      string | null
          validity_date?:      string | null
          notes?:              string | null
          rejection_reason?:   string | null
          submitted_at?:       string | null
          reviewed_at?:        string | null
          approved_at?:        string | null
          rejected_at?:        string | null
          created_by?:         string | null
          updated_by?:         string | null
          created_at?:         string
          updated_at?:         string
        }
        Update: Partial<Omit<Database['public']['Tables']['quotations']['Insert'], 'company_id'>>
      }

      // ── quotation_items ───────────────────────────────────────────────────
      quotation_items: {
        Row: {
          id:                string
          quotation_id:      string
          rfq_item_id:       string | null
          item_name:         string
          description:       string | null
          part_number:       string | null
          unit:              string
          quantity:          number
          unit_price:        number
          discount_pct:      number
          discount_amount:   number
          tax_pct:           number
          tax_amount:        number
          line_total:        number
          delivery_days:     number | null
          warranty_months:   number | null
          remarks:           string | null
          sort_order:        number
          created_at:        string
          updated_at:        string
        }
        Insert: {
          id?:                string
          quotation_id:       string
          rfq_item_id?:       string | null
          item_name:          string
          description?:       string | null
          part_number?:       string | null
          unit?:              string
          quantity?:          number
          unit_price?:        number
          discount_pct?:      number
          discount_amount?:   number
          tax_pct?:           number
          tax_amount?:        number
          line_total?:        number
          delivery_days?:     number | null
          warranty_months?:   number | null
          remarks?:           string | null
          sort_order?:        number
          created_at?:        string
          updated_at?:        string
        }
        Update: Partial<Omit<Database['public']['Tables']['quotation_items']['Insert'], 'quotation_id'>>
      }

      // ── purchase_orders ───────────────────────────────────────────────────
      purchase_orders: {
        Row: {
          id:               string
          company_id:       string
          po_number:        string
          vendor_id:        string
          rfq_id:           string | null
          quotation_id:     string | null
          status:           PoStatus
          total_amount:     number | null
          due_date:         string | null
          shipping_address: string | null
          billing_address:  string | null
          payment_terms:    string | null
          notes:            string | null
          created_by:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          company_id:        string
          po_number?:        string
          vendor_id:         string
          rfq_id?:           string | null
          quotation_id?:     string | null
          status?:           PoStatus
          total_amount?:     number | null
          due_date?:         string | null
          shipping_address?: string | null
          billing_address?:  string | null
          payment_terms?:    string | null
          notes?:            string | null
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
        Update: Partial<Omit<Database['public']['Tables']['purchase_orders']['Insert'], 'company_id'>>
      }

      // ── purchase_order_items ──────────────────────────────────────────────
      purchase_order_items: {
        Row: {
          id:                 string
          purchase_order_id:  string
          description:        string
          quantity:           number
          unit:               string
          unit_price:         number
          total_price:        number
          created_at:         string
        }
        Insert: {
          id?:                 string
          purchase_order_id:   string
          description:         string
          quantity?:           number
          unit?:               string
          unit_price?:         number
          created_at?:         string
        }
        Update: Partial<Omit<Database['public']['Tables']['purchase_order_items']['Insert'], 'purchase_order_id'>>
      }

      // ── invoices ──────────────────────────────────────────────────────────
      invoices: {
        Row: {
          id:                 string
          company_id:         string
          purchase_order_id:  string | null
          vendor_id:          string
          invoice_number:     string
          invoice_date:       string
          due_date:           string | null
          status:             InvoiceStatus
          subtotal:           number
          tax_amount:         number
          discount_amount:    number
          total_amount:       number
          paid_amount:        number
          remaining_amount:   number
          currency:           string
          notes:              string | null
          created_by:         string | null
          created_at:         string
          updated_at:         string
        }
        Insert: {
          id?:                 string
          company_id:          string
          purchase_order_id?:  string | null
          vendor_id:           string
          invoice_number?:     string
          invoice_date?:       string
          due_date?:           string | null
          status?:             InvoiceStatus
          subtotal?:           number
          tax_amount?:         number
          discount_amount?:    number
          total_amount?:       number
          paid_amount?:        number
          currency?:           string
          notes?:              string | null
          created_by?:         string | null
          created_at?:         string
          updated_at?:         string
        }
        Update: Partial<Omit<Database['public']['Tables']['invoices']['Insert'], 'company_id'>>
      }

      // ── invoice_items ─────────────────────────────────────────────────────
      invoice_items: {
        Row: {
          id:              string
          invoice_id:      string
          product_id:      string | null
          description:     string
          quantity:        number
          unit_price:      number
          tax_percentage:  number
          line_total:      number
          created_at:      string
        }
        Insert: {
          id?:              string
          invoice_id:       string
          product_id?:      string | null
          description:      string
          quantity?:        number
          unit_price?:      number
          tax_percentage?:  number
          created_at?:      string
        }
        Update: Partial<Omit<Database['public']['Tables']['invoice_items']['Insert'], 'invoice_id'>>
      }

      // ── payments ──────────────────────────────────────────────────────────
      payments: {
        Row: {
          id:                  string
          invoice_id:          string
          company_id:          string
          vendor_id:           string
          payment_reference:   string
          payment_date:        string
          payment_method:      PaymentMethod
          amount:              number
          notes:               string | null
          created_by:          string | null
          created_at:          string
        }
        Insert: {
          id?:                  string
          invoice_id:           string
          company_id:           string
          vendor_id:            string
          payment_reference?:   string
          payment_date?:        string
          payment_method?:      PaymentMethod
          amount:               number
          notes?:               string | null
          created_by?:          string | null
          created_at?:          string
        }
        Update: Partial<Omit<Database['public']['Tables']['payments']['Insert'], 'company_id'>>
      }

      // ── products ──────────────────────────────────────────────────────────
      products: {
        Row: {
          id:                    string
          company_id:            string
          category_id:           string | null
          preferred_vendor_id:   string | null
          name:                  string
          sku:                   string
          description:           string | null
          unit:                  string
          unit_cost:             number
          status:                ProductStatus
          min_stock_level:       number
          max_stock_level:       number | null
          reorder_level:         number
          lead_time_days:        number | null
          notes:                 string | null
          created_at:            string
          updated_at:            string
        }
        Insert: {
          id?:                    string
          company_id:             string
          category_id?:           string | null
          preferred_vendor_id?:   string | null
          name:                   string
          sku:                    string
          description?:           string | null
          unit?:                  string
          unit_cost?:             number
          status?:                ProductStatus
          min_stock_level?:       number
          max_stock_level?:       number | null
          reorder_level?:         number
          lead_time_days?:        number | null
          notes?:                 string | null
          created_at?:            string
          updated_at?:            string
        }
        Update: Partial<Omit<Database['public']['Tables']['products']['Insert'], 'company_id'>>
      }

      // ── product_categories ────────────────────────────────────────────────
      product_categories: {
        Row: {
          id:           string
          company_id:   string
          name:         string
          description:  string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          name:          string
          description?:  string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['product_categories']['Insert'], 'company_id'>>
      }

      // ── warehouses ────────────────────────────────────────────────────────
      warehouses: {
        Row: {
          id:           string
          company_id:   string
          name:         string
          code:         string
          address:      string | null
          is_default:   boolean
          is_active:    boolean
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          name:          string
          code:          string
          address?:      string | null
          is_default?:   boolean
          is_active?:    boolean
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['warehouses']['Insert'], 'company_id'>>
      }

      // ── inventory ─────────────────────────────────────────────────────────
      inventory: {
        Row: {
          id:                   string
          company_id:           string
          product_id:           string
          warehouse_id:         string
          quantity_on_hand:     number
          quantity_reserved:    number
          quantity_available:   number
          valuation:            number
          last_updated:         string
          created_at:           string
        }
        Insert: {
          id?:                   string
          company_id:            string
          product_id:            string
          warehouse_id:          string
          quantity_on_hand?:     number
          quantity_reserved?:    number
          valuation?:            number
          last_updated?:         string
          created_at?:           string
        }
        Update: Partial<Omit<Database['public']['Tables']['inventory']['Insert'], 'company_id' | 'product_id' | 'warehouse_id'>>
      }

      // ── grn ───────────────────────────────────────────────────────────────
      grn: {
        Row: {
          id:                 string
          company_id:         string
          grn_number:         string
          purchase_order_id:  string | null
          warehouse_id:       string
          received_by:        string
          received_date:      string
          status:             GrnStatus
          notes:              string | null
          created_at:         string
          updated_at:         string
        }
        Insert: {
          id?:                 string
          company_id:          string
          grn_number?:         string
          purchase_order_id?:  string | null
          warehouse_id:        string
          received_by:         string
          received_date?:      string
          status?:             GrnStatus
          notes?:              string | null
          created_at?:         string
          updated_at?:         string
        }
        Update: Partial<Omit<Database['public']['Tables']['grn']['Insert'], 'company_id'>>
      }

      // ── grn_items ─────────────────────────────────────────────────────────
      grn_items: {
        Row: {
          id:                 string
          grn_id:             string
          product_id:         string
          ordered_quantity:   number
          received_quantity:  number
          unit_cost:          number
          notes:              string | null
        }
        Insert: {
          id?:                 string
          grn_id:              string
          product_id:          string
          ordered_quantity?:   number
          received_quantity?:  number
          unit_cost?:          number
          notes?:              string | null
        }
        Update: Partial<Omit<Database['public']['Tables']['grn_items']['Insert'], 'grn_id'>>
      }

      // ── inventory_transactions ────────────────────────────────────────────
      inventory_transactions: {
        Row: {
          id:                string
          company_id:        string
          product_id:        string
          warehouse_id:      string
          transaction_type:  InventoryTransactionType
          quantity:          number
          quantity_before:   number
          quantity_after:    number
          reference_type:    string | null
          reference_id:      string | null
          notes:             string | null
          created_by:        string
          created_at:        string
        }
        Insert: {
          id?:                string
          company_id:         string
          product_id:         string
          warehouse_id:       string
          transaction_type:   InventoryTransactionType
          quantity:           number
          quantity_before:    number
          quantity_after:     number
          reference_type?:    string | null
          reference_id?:      string | null
          notes?:             string | null
          created_by:         string
          created_at?:        string
        }
        Update: Partial<Database['public']['Tables']['inventory_transactions']['Insert']>
      }

      // ── approval_workflows ────────────────────────────────────────────────
      approval_workflows: {
        Row: {
          id:           string
          company_id:   string
          name:         string
          description:  string | null
          entity_type:  ApprovalEntityType
          is_active:    boolean
          is_default:   boolean
          created_by:   string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          name:          string
          description?:  string | null
          entity_type:   ApprovalEntityType
          is_active?:    boolean
          is_default?:   boolean
          created_by?:   string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['approval_workflows']['Insert'], 'company_id'>>
      }

      // ── approval_workflow_steps ───────────────────────────────────────────
      approval_workflow_steps: {
        Row: {
          id:             string
          workflow_id:    string
          company_id:     string
          step_order:     number
          name:           string
          role_required:  string
          approver_id:    string | null
          is_optional:    boolean
          timeout_hours:  number | null
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:             string
          workflow_id:     string
          company_id:      string
          step_order:      number
          name:            string
          role_required?:  string
          approver_id?:    string | null
          is_optional?:    boolean
          timeout_hours?:  number | null
          created_at?:     string
          updated_at?:     string
        }
        Update: Partial<Omit<Database['public']['Tables']['approval_workflow_steps']['Insert'], 'workflow_id' | 'company_id'>>
      }

      // ── approval_requests ─────────────────────────────────────────────────
      approval_requests: {
        Row: {
          id:               string
          company_id:       string
          workflow_id:      string | null
          entity_type:      ApprovalEntityType
          entity_id:        string
          entity_ref:       string | null
          status:           ApprovalRequestStatus
          current_step:     number
          total_steps:      number
          amount:           number | null
          currency:         string | null
          title:            string
          description:      string | null
          priority:         string
          due_date:         string | null
          requested_by:     string | null
          submitted_at:     string | null
          completed_at:     string | null
          rejection_reason: string | null
          return_reason:    string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          company_id:        string
          workflow_id?:      string | null
          entity_type:       ApprovalEntityType
          entity_id:         string
          entity_ref?:       string | null
          status?:           ApprovalRequestStatus
          current_step?:     number
          total_steps?:      number
          amount?:           number | null
          currency?:         string | null
          title:             string
          description?:      string | null
          priority?:         string
          due_date?:         string | null
          requested_by?:     string | null
          submitted_at?:     string | null
          completed_at?:     string | null
          rejection_reason?: string | null
          return_reason?:    string | null
          created_at?:       string
          updated_at?:       string
        }
        Update: Partial<Omit<Database['public']['Tables']['approval_requests']['Insert'], 'company_id'>>
      }

      // ── approval_steps ────────────────────────────────────────────────────
      approval_steps: {
        Row: {
          id:               string
          request_id:       string
          company_id:       string
          workflow_step_id: string | null
          step_order:       number
          name:             string
          role_required:    string
          approver_id:      string | null
          is_optional:      boolean
          status:           ApprovalStepStatus
          comments:         string | null
          decided_at:       string | null
          due_at:           string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          request_id:        string
          company_id:        string
          workflow_step_id?: string | null
          step_order:        number
          name:              string
          role_required?:    string
          approver_id?:      string | null
          is_optional?:      boolean
          status?:           ApprovalStepStatus
          comments?:         string | null
          decided_at?:       string | null
          due_at?:           string | null
          created_at?:       string
          updated_at?:       string
        }
        Update: Partial<Omit<Database['public']['Tables']['approval_steps']['Insert'], 'request_id' | 'company_id'>>
      }

      // ── approval_actions ──────────────────────────────────────────────────
      approval_actions: {
        Row: {
          id:           string
          request_id:   string
          step_id:      string | null
          company_id:   string
          action_type:  ApprovalActionType
          actor_id:     string | null
          comment:      string | null
          is_internal:  boolean
          old_status:   ApprovalRequestStatus | null
          new_status:   ApprovalRequestStatus | null
          metadata:     Json | null
          performed_at: string
        }
        Insert: {
          id?:           string
          request_id:    string
          step_id?:      string | null
          company_id:    string
          action_type:   ApprovalActionType
          actor_id?:     string | null
          comment?:      string | null
          is_internal?:  boolean
          old_status?:   ApprovalRequestStatus | null
          new_status?:   ApprovalRequestStatus | null
          metadata?:     Json | null
          performed_at?: string
        }
        Update: Partial<Database['public']['Tables']['approval_actions']['Insert']>
      }

      // ── approval_notifications ────────────────────────────────────────────
      approval_notifications: {
        Row: {
          id:           string
          request_id:   string | null
          company_id:   string
          recipient_id: string | null
          type:         string
          title:        string
          body:         string
          is_read:      boolean
          read_at:      string | null
          sent_at:      string | null
          link:         string | null
          entity_type:  string | null
          entity_id:    string | null
          created_at:   string
        }
        Insert: {
          id?:           string
          request_id?:   string | null
          company_id:    string
          recipient_id?: string | null
          type:          string
          title:         string
          body:          string
          is_read?:      boolean
          read_at?:      string | null
          sent_at?:      string | null
          link?:         string | null
          entity_type?:  string | null
          entity_id?:    string | null
          created_at?:   string
        }
        Update: Partial<Database['public']['Tables']['approval_notifications']['Insert']>
      }

      // ── roles ─────────────────────────────────────────────────────────────
      roles: {
        Row: {
          id:           string
          company_id:   string
          name:         string
          slug:         string
          description:  string | null
          is_system:    boolean
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          name:          string
          slug:          string
          description?:  string | null
          is_system?:    boolean
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['roles']['Insert'], 'company_id'>>
      }

      // ── permissions ───────────────────────────────────────────────────────
      permissions: {
        Row: {
          id:           string
          key:          string
          label:        string
          group_name:   string
          description:  string | null
        }
        Insert: {
          id?:           string
          key:           string
          label:         string
          group_name:    string
          description?:  string | null
        }
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>
      }

      // ── role_permissions ──────────────────────────────────────────────────
      role_permissions: {
        Row: {
          id:             string
          role_id:        string
          permission_id:  string
        }
        Insert: {
          id?:             string
          role_id:         string
          permission_id:   string
        }
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>
      }

      // ── user_roles ────────────────────────────────────────────────────────
      user_roles: {
        Row: {
          id:           string
          user_id:      string
          role_id:      string
          company_id:   string
          assigned_at:  string
        }
        Insert: {
          id?:           string
          user_id:       string
          role_id:       string
          company_id:    string
          assigned_at?:  string
        }
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
      }

      // ── employee_invitations ──────────────────────────────────────────────
      employee_invitations: {
        Row: {
          id:           string
          company_id:   string
          email:        string
          full_name:    string | null
          role_slug:    string
          department:   string | null
          designation:  string | null
          token:        string
          invited_by:   string | null
          accepted_at:  string | null
          expires_at:   string
          created_at:   string
        }
        Insert: {
          id?:           string
          company_id:    string
          email:         string
          full_name?:    string | null
          role_slug?:    string
          department?:   string | null
          designation?:  string | null
          token?:        string
          invited_by?:   string | null
          accepted_at?:  string | null
          expires_at?:   string
          created_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['employee_invitations']['Insert'], 'company_id'>>
      }

      // ── vendor_users ──────────────────────────────────────────────────────
      vendor_users: {
        Row: {
          id:           string
          user_id:      string
          vendor_id:    string
          company_id:   string
          role:         string
          full_name:    string | null
          email:        string | null
          phone:        string | null
          avatar_url:   string | null
          is_primary:   boolean
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          user_id:       string
          vendor_id:     string
          company_id:    string
          role?:         string
          full_name?:    string | null
          email?:        string | null
          phone?:        string | null
          avatar_url?:   string | null
          is_primary?:   boolean
          created_at?:   string
          updated_at?:   string
        }
        Update: Partial<Omit<Database['public']['Tables']['vendor_users']['Insert'], 'user_id' | 'vendor_id'>>
      }

      // ── vendor_notifications ──────────────────────────────────────────────
      vendor_notifications: {
        Row: {
          id:            string
          vendor_id:     string
          company_id:    string
          type:          string
          title:         string
          message:       string
          read:          boolean
          link:          string | null
          reference_id:  string | null
          created_at:    string
        }
        Insert: {
          id?:            string
          vendor_id:      string
          company_id:     string
          type:           string
          title:          string
          message:        string
          read?:          boolean
          link?:          string | null
          reference_id?:  string | null
          created_at?:    string
        }
        Update: Partial<Omit<Database['public']['Tables']['vendor_notifications']['Insert'], 'vendor_id' | 'company_id'>>
      }

      // ── vendor_companies ──────────────────────────────────────────────────
      vendor_companies: {
        Row: {
          id:            string
          user_id:       string
          company_name:  string
          contact_name:  string | null
          email:         string
          phone:         string | null
          website:       string | null
          address:       string | null
          industry:      string | null
          gst_number:    string | null
          description:   string | null
          logo_url:      string | null
          status:        string
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          user_id:        string
          company_name:   string
          contact_name?:  string | null
          email:          string
          phone?:         string | null
          website?:       string | null
          address?:       string | null
          industry?:      string | null
          gst_number?:    string | null
          description?:   string | null
          logo_url?:      string | null
          status?:        string
          created_at?:    string
          updated_at?:    string
        }
        Update: Partial<Omit<Database['public']['Tables']['vendor_companies']['Insert'], 'user_id'>>
      }

      // ── collaboration_requests ────────────────────────────────────────────
      collaboration_requests: {
        Row: {
          id:                 string
          vendor_user_id:     string
          vendor_company_id:  string
          company_id:         string
          status:             CollaborationRequestStatus
          message:            string | null
          rejection_reason:   string | null
          reviewed_by:        string | null
          reviewed_at:        string | null
          created_at:         string
          updated_at:         string
        }
        Insert: {
          id?:                 string
          vendor_user_id:      string
          vendor_company_id:   string
          company_id:          string
          status?:             CollaborationRequestStatus
          message?:            string | null
          rejection_reason?:   string | null
          reviewed_by?:        string | null
          reviewed_at?:        string | null
          created_at?:         string
          updated_at?:         string
        }
        Update: Partial<Omit<Database['public']['Tables']['collaboration_requests']['Insert'], 'vendor_user_id' | 'company_id'>>
      }

      // ── quotation_comments ────────────────────────────────────────────────
      quotation_comments: {
        Row: {
          id:            string
          quotation_id:  string
          company_id:    string
          comment:       string
          is_internal:   boolean
          created_by:    string | null
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          quotation_id:   string
          company_id:     string
          comment:        string
          is_internal?:   boolean
          created_by?:    string | null
          created_at?:    string
          updated_at?:    string
        }
        Update: Partial<Omit<Database['public']['Tables']['quotation_comments']['Insert'], 'quotation_id' | 'company_id'>>
      }

      // ── quotation_history ─────────────────────────────────────────────────
      quotation_history: {
        Row: {
          id:            string
          quotation_id:  string
          company_id:    string
          action:        string
          old_values:    Json | null
          new_values:    Json | null
          notes:         string | null
          performed_by:  string | null
          performed_at:  string
        }
        Insert: {
          id?:            string
          quotation_id:   string
          company_id:     string
          action:         string
          old_values?:    Json | null
          new_values?:    Json | null
          notes?:         string | null
          performed_by?:  string | null
          performed_at?:  string
        }
        Update: Partial<Database['public']['Tables']['quotation_history']['Insert']>
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      current_company_id:       { Args: Record<string, never>; Returns: string }
      current_vendor_id:        { Args: Record<string, never>; Returns: string }
      get_user_portal:          { Args: { p_user_id: string };  Returns: Json }
      generate_rfq_number:      { Args: Record<string, never>; Returns: undefined }
      generate_po_number:       { Args: Record<string, never>; Returns: undefined }
      generate_invoice_number:  { Args: Record<string, never>; Returns: undefined }
      generate_payment_reference: { Args: Record<string, never>; Returns: undefined }
      generate_quotation_number:{ Args: { p_company_id: string }; Returns: string }
      seed_system_roles:        { Args: { p_company_id: string }; Returns: undefined }
      accept_collaboration_request: { Args: { p_request_id: string; p_reviewed_by: string }; Returns: string }
    }

    Enums: {
      vendor_status:            VendorStatus
      vendor_category:          VendorCategory
      contract_type:            ContractType
      payment_terms:            PaymentTerms
      document_type:            DocumentType
      rfq_status:               RfqStatus
      rfq_priority:             RfqPriority
      po_status:                PoStatus
      quotation_status:         QuotationStatus
      invoice_status:           InvoiceStatus
      payment_method:           PaymentMethod
      approval_entity_type:     ApprovalEntityType
      approval_request_status:  ApprovalRequestStatus
      approval_step_status:     ApprovalStepStatus
      approval_action_type:     ApprovalActionType
      inventory_transaction_type: InventoryTransactionType
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
