
export interface Vendor {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'inactive';
  totalPOs: number;
  poIds: string[]; 
  city?: string;
  country?: string;
  // New properties for filtering
  specialty?: string;
  hasNegotiatedRates?: boolean;
  businessVolume?: number;
  averageRating?: number;
  totalRatings?: number;
  supplierTypeId?: string;
  supplierTypeIcon?: string;
  isPOExempt?: boolean;
  paymentMethodName?: string;
  paymentModalityName?: string;
  ytdAmount?: number;
  prevYearAmount?: number;
  // Type de prestation par défaut → famille de dépenses P&L
  serviceTypeName?: string;
  expenseFamilyName?: string;
  isMixed?: boolean; // BdC répartis sur plusieurs familles de dépenses
}

export interface SupplierType {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

export interface ArticleType {
  id: string;
  user_id: string;
  supplier_type_id: string;
  name: string;
  description?: string;
  unit?: string;
  default_unit_price?: number;
  is_active?: boolean;
}

export interface SupplierRating {
  id: string;
  supplier_id: string;
  user_id: string;
  po_id?: string;
  rating: number;
  comment?: string;
  service_date?: string;
  created_at: string;
}

// Legacy export kept for backward compat; real data comes from Supabase.
export const mockVendors: Vendor[] = [];
