
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Plus, Search } from 'lucide-react';
import VendorsList from '@/components/vendors/VendorsList';
import VendorFilters from '@/components/vendors/VendorFilters';
import InviteVendorDialog from '@/components/vendors/InviteVendorDialog';
import { mockVendors } from '@/types/vendor';

const Vendors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
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
        <VendorFilters 
          showFilters={showFilters}
          toggleFilters={toggleFilters}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          cityFilter={cityFilter}
          setCityFilter={setCityFilter}
          countryFilter={countryFilter}
          setCountryFilter={setCountryFilter}
          resetFilters={resetFilters}
          categories={categories}
          cities={cities}
          countries={countries}
        />
      </div>

      <VendorsList vendors={filteredVendors} />

      <InviteVendorDialog 
        isOpen={isInviteDialogOpen} 
        onOpenChange={setIsInviteDialogOpen} 
      />
    </div>
  );
};

export default Vendors;
