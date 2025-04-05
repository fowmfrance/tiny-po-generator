
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Search, 
  Plus, 
  Building, 
  Mail, 
  Phone, 
  ArrowRight,
  UserPlus,
  Filter,
  MapPin,
  Globe,
  Activity
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define vendor type
export interface Vendor {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'inactive';
  totalPOs: number;
  poIds: string[]; // Add poIds property
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

const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const { toast } = useToast();
  
  // Add filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories, cities, countries for filter options
  const categories = ['all', ...new Set(mockVendors.map(v => v.category))];
  const cities = ['all', ...new Set(mockVendors.map(v => v.city).filter(Boolean))];
  const countries = ['all', ...new Set(mockVendors.map(v => v.country).filter(Boolean))];

  // Filter vendors based on search term and filters
  const filteredVendors = mockVendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || vendor.country === countryFilter;
    const matchesCity = cityFilter === 'all' || vendor.city === cityFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesCountry && matchesCity;
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a draft vendor record (would typically save to database)
    const newVendorId = `draft-${Date.now()}`;
    
    // In a real application, this would add to the database
    // and trigger an email to the supplier
    
    toast({
      title: "Fournisseur invité avec succès",
      description: `Un email d'invitation a été envoyé à ${vendorEmail}`,
    });
    
    // Close the dialog and reset form
    setIsInviteDialogOpen(false);
    setVendorName('');
    setVendorEmail('');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setCountryFilter('all');
    setCityFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fournisseurs</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsInviteDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Inviter un Fournisseur
          </Button>
          <Link to="/vendors/new">
            <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un Fournisseur
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher des fournisseurs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={toggleFilters}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {(categoryFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all' || cityFilter !== 'all') && (
            <span className="bg-po-blue text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ml-1">
              {[categoryFilter, statusFilter, countryFilter, cityFilter].filter(f => f !== 'all').length}
            </span>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                Activité
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les activités" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'Toutes les activités' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-gray-300" />
                Statut
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                Ville
              </Label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les villes" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city === 'all' ? 'Toutes les villes' : city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                Pays
              </Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country === 'all' ? 'Tous les pays' : country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={resetFilters} className="text-sm">
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      )}

      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{vendor.name}</CardTitle>
                    <CardDescription>{vendor.category}</CardDescription>
                  </div>
                  <div>
                    {vendor.status === 'active' && (
                      <span className="status-badge status-approved">Actif</span>
                    )}
                    {vendor.status === 'pending' && (
                      <span className="status-badge status-pending">En attente</span>
                    )}
                    {vendor.status === 'inactive' && (
                      <span className="status-badge status-draft">Inactif</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{vendor.totalPOs} Bons de Commande</span>
                  </div>
                  {vendor.city && vendor.country && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{vendor.city}, {vendor.country}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 pt-3">
                <Link 
                  to={`/vendors/${vendor.id}`} 
                  className="text-po-blue hover:text-blue-700 text-sm flex items-center ml-auto"
                >
                  Voir les détails
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">Aucun fournisseur trouvé.</p>
          <Link to="/vendors/new">
            <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un Fournisseur
            </Button>
          </Link>
        </div>
      )}

      {/* Invite Vendor Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inviter un Fournisseur</DialogTitle>
            <DialogDescription>
              Envoyer un email d'invitation à un fournisseur pour rejoindre votre réseau.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor-name">Nom du Fournisseur</Label>
                <Input
                  id="vendor-name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Entrez le nom de l'entreprise"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-email">Email de Contact</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="contact@entreprise.com"
                  required
                />
                <p className="text-sm text-gray-500">
                  Un lien d'invitation sera envoyé à cette adresse email
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Envoyer l'Invitation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendors;
