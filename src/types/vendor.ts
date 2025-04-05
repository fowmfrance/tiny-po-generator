
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
}

// Mock data for demonstration - Export this for use in other components
export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Apple Inc.',
    category: 'Technologie',
    email: 'procurement@apple.com',
    phone: '+1 (800) 275-2273',
    status: 'active',
    totalPOs: 12,
    poIds: ['1', '2'],
    city: 'Cupertino',
    country: 'États-Unis'
  },
  {
    id: '2',
    name: 'Microsoft Corp',
    category: 'Logiciel',
    email: 'vendor@microsoft.com',
    phone: '+1 (800) 642-7676',
    status: 'active',
    totalPOs: 8,
    poIds: ['3', '4'],
    city: 'Redmond',
    country: 'États-Unis'
  },
  {
    id: '3',
    name: 'Dell Technologies',
    category: 'Matériel',
    email: 'sales@dell.com',
    phone: '+1 (800) 624-9897',
    status: 'active',
    totalPOs: 5,
    poIds: ['5'],
    city: 'Round Rock',
    country: 'États-Unis'
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
    country: 'États-Unis'
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
    country: 'Corée du Sud'
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
    country: 'Suisse'
  }
];
