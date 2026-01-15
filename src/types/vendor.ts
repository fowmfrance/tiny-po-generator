
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

// Mock data for demonstration
export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'KLP Design ✏️',
    category: 'Technologie',
    email: 'contact@klpdesign.com',
    phone: '+1 (800) 275-2273',
    status: 'active',
    totalPOs: 12,
    poIds: ['1', '2'],
    city: 'Cupertino',
    country: 'États-Unis',
    specialty: 'Design graphique',
    hasNegotiatedRates: true,
    businessVolume: 45000,
    averageRating: 4.5,
    totalRatings: 8
  },
  {
    id: '2',
    name: 'DJ Bob 🎵',
    category: 'Événementiel',
    email: 'booking@djbob.com',
    phone: '+1 (800) 642-7676',
    status: 'active',
    totalPOs: 8,
    poIds: ['3', '4'],
    city: 'Redmond',
    country: 'États-Unis',
    specialty: 'Animation musicale',
    hasNegotiatedRates: false,
    businessVolume: 28000,
    averageRating: 4.8,
    totalRatings: 6
  },
  {
    id: '3',
    name: 'Orlando Traiteur 🍽️',
    category: 'Restauration',
    email: 'contact@orlando-traiteur.com',
    phone: '+1 (800) 624-9897',
    status: 'active',
    totalPOs: 5,
    poIds: ['5'],
    city: 'Round Rock',
    country: 'États-Unis',
    specialty: 'Traiteur événementiel',
    hasNegotiatedRates: true,
    businessVolume: 85000,
    averageRating: 4.2,
    totalRatings: 4
  },
  {
    id: '4',
    name: 'Amazon Business',
    category: 'Fournitures de Bureau',
    email: 'business@amazon.com',
    phone: '+1 (866) 486-2360',
    status: 'pending',
    totalPOs: 0,
    poIds: [],
    city: 'Seattle',
    country: 'États-Unis',
    specialty: 'Fournitures générales',
    hasNegotiatedRates: false,
    businessVolume: 0,
    averageRating: 0,
    totalRatings: 0
  },
  {
    id: '5',
    name: 'Samsung Electronics',
    category: 'Électronique',
    email: 'b2b@samsung.com',
    phone: '+1 (800) 726-7864',
    status: 'active',
    totalPOs: 3,
    poIds: ['6'],
    city: 'Séoul',
    country: 'Corée du Sud',
    specialty: 'Matériel informatique',
    hasNegotiatedRates: true,
    businessVolume: 120000,
    averageRating: 4.0,
    totalRatings: 3
  },
  {
    id: '6',
    name: 'Logitech',
    category: 'Accessoires Informatiques',
    email: 'sales@logitech.com',
    phone: '+1 (800) 231-7717',
    status: 'inactive',
    totalPOs: 2,
    poIds: ['7', '8'],
    city: 'Lausanne',
    country: 'Suisse',
    specialty: 'Périphériques',
    hasNegotiatedRates: false,
    businessVolume: 15000,
    averageRating: 3.5,
    totalRatings: 2
  }
];
