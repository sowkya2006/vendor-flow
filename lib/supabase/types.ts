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

// ---------------------------------------------------------------------------
// Database shape (used by the Supabase client generic)
// ---------------------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id:         string
          name:       string
          domain:     string | null
          logo_url:   string | null
          address:    string | null
          phone:      string | null
          website:    string | null
          industry:   string | null
          size:       string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:        string
          name:       string
          domain?:    string | null
          logo_url?:  string | null
          address?:   string | null
          phone?:     string | null
          website?:   string | null
          industry?:  string | null
          size?:      string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }

      users: {
        Row: {
          id:         string
          company_id: string
          full_name:  string | null
          email:      string | null
          role:       string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id:          string
          company_id:  string
          full_name?:  string | null
          email?:      string | null
          role?:       string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Database['public']['Tables']['users']['Insert'], 'id'>>
      }

      categories: {
        Row: {
          id:          string
          company_id:  string
          name:        string
          description: string | null
          color:       string | null
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:          string
          company_id:   string
          name:         string
          description?: string | null
          color?:       string | null
          created_at?:  string
          updated_at?:  string
        }
        Update: Partial<Omit<Database['public']['Tables']['categories']['Insert'], 'company_id'>>
      }

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
    }
    Views: {}
    Functions: {
      current_company_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      vendor_status:   VendorStatus
      vendor_category: VendorCategory
      contract_type:   ContractType
      payment_terms:   PaymentTerms
      document_type:   DocumentType
    }
    CompositeTypes: {}
  }
}
