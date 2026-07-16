import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, FileText, LayoutGrid, List } from 'lucide-react';
import VendorsList, { VendorsGroupBy } from '@/components/vendors/VendorsList';
import VendorFilters, { VendorFiltersButton } from '@/components/vendors/VendorFilters';
import InviteVendorDialog from '@/components/vendors/InviteVendorDialog';
import { useSuppliers, Supplier } from '@/hooks/useSuppliers';
import { Vendor } from '@/types/vendor';
import { cn } from '@/lib/utils';

const TABS: { key: VendorsGroupBy; label: string }[] = [
  { key: 'activity', label: 'Par activité' },
  { key: 'budget', label: 'Par nature de budget' },
];

// Map Supplier from DB to the Vendor interface used by components
function supplierToVendor(s: Supplier): Vendor {
  return {
    id: s.id,
    name: s.name,
    category: s.supplier_type?.name || 'Non classé',
    email: s.email || '',
    phone: s.phone || '',
    status: s.is_active ? 'active' : 'inactive',
    totalPOs: s.po_count || 0,
    poIds: [],
    city: s.city || undefined,
    country: s.country || undefined,
    specialty: s.specialty || undefined,
    hasNegotiatedRates: s.has_negotiated_rates,
    businessVolume: s.business_volume,
    averageRating: s.average_rating || 0,
    totalRatings: s.total_ratings || 0,
    supplierTypeId: s.supplier_type_id || undefined,
    supplierTypeIcon: s.supplier_type?.icon || undefined,
    isPOExempt: s.is_po_exempt || false,
    paymentMethodName: s.payment_method?.name || undefined,
    paymentModalityName: s.payment_modality?.name || undefined,
    ytdAmount: s.ytd_amount || 0,
    prevYearAmount: s.prev_year_amount || 0,
    serviceTypeName: s.service_type?.name || undefined,
    expenseFamilyName: s.expense_family_name || undefined,
    isMixed: s.is_mixed || false,
  };
}

const Vendors = () => {
  const navigate = useNavigate();
  const { suppliers, isLoading } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Sous-onglet actif (mode de regroupement), persisté dans l'URL (/vendors?tab=budget)
  const activeTab: VendorsGroupBy = searchParams.get('tab') === 'budget' ? 'budget' : 'activity';
  const setActiveTab = (tab: VendorsGroupBy) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'budget') next.set('tab', 'budget');
    else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  // Ouverture directe du dialogue d'ajout via /vendors?add=1 (action rapide)
  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setIsInviteDialogOpen(true);
      searchParams.delete('add');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [negotiatedRatesFilter, setNegotiatedRatesFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const vendors = useMemo(() => suppliers.map(supplierToVendor), [suppliers]);

  const categories = useMemo(() => ['all', ...new Set(vendors.map(v => v.category))], [vendors]);
  const cities = useMemo(() => ['all', ...new Set(vendors.map(v => v.city).filter(Boolean) as string[])], [vendors]);
  const countries = useMemo(() => ['all', ...new Set(vendors.map(v => v.country).filter(Boolean) as string[])], [vendors]);
  const specialties = useMemo(() => ['all', ...new Set(vendors.map(v => v.specialty).filter(Boolean) as string[])], [vendors]);

  const filteredVendors = useMemo(() => vendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(vendor.category);
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || vendor.country === countryFilter;
    const matchesCity = cityFilter === 'all' || vendor.city === cityFilter;
    const matchesSpecialty = specialtyFilter === 'all' || vendor.specialty === specialtyFilter;
    
    const matchesNegotiatedRates = 
      negotiatedRatesFilter === 'all' ||
      (negotiatedRatesFilter === 'yes' && vendor.hasNegotiatedRates) ||
      (negotiatedRatesFilter === 'no' && !vendor.hasNegotiatedRates);
    
    const matchesVolume = (() => {
      if (volumeFilter === 'all') return true;
      const volume = vendor.businessVolume || 0;
      switch (volumeFilter) {
        case 'low': return volume < 10000;
        case 'medium': return volume >= 10000 && volume < 50000;
        case 'high': return volume >= 50000 && volume < 100000;
        case 'very-high': return volume >= 100000;
        default: return true;
      }
    })();
    
    const matchesRating = (() => {
      if (ratingFilter === 'all') return true;
      const rating = vendor.averageRating || 0;
      return rating >= parseFloat(ratingFilter);
    })();
    
    return matchesSearch && matchesCategory && matchesStatus && 
           matchesCountry && matchesCity && matchesSpecialty && 
           matchesNegotiatedRates && matchesVolume && matchesRating;
  }), [vendors, searchTerm, categoryFilter, statusFilter, countryFilter, cityFilter, specialtyFilter, negotiatedRatesFilter, volumeFilter, ratingFilter]);

  const toggleFilters = () => setShowFilters(!showFilters);

  const activeFiltersCount = [
    categoryFilter.length > 0 ? 'active' : 'all',
    statusFilter,
    countryFilter,
    cityFilter,
    specialtyFilter,
    negotiatedRatesFilter,
    volumeFilter,
    ratingFilter,
  ].filter(f => f !== 'all').length;

  const resetFilters = () => {
    setCategoryFilter([]);
    setStatusFilter('all');
    setCountryFilter('all');
    setCityFilter('all');
    setSpecialtyFilter('all');
    setNegotiatedRatesFilter('all');
    setVolumeFilter('all');
    setRatingFilter('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Fournisseurs</h1>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === t.key ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setIsInviteDialogOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Inviter un Fournisseur
        </Button>
      </div>

      <div>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Chargement des fournisseurs...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, spécialité, catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => navigate('/das2')}
                  >
                    <FileText className="w-4 h-4" />
                    DAS2
                  </Button>
                  <VendorFiltersButton
                    showFilters={showFilters}
                    toggleFilters={toggleFilters}
                    activeFiltersCount={activeFiltersCount}
                  />
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none h-8 px-2"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-none h-8 px-2"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {showFilters && (
                <VendorFilters
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  cityFilter={cityFilter}
                  setCityFilter={setCityFilter}
                  countryFilter={countryFilter}
                  setCountryFilter={setCountryFilter}
                  specialtyFilter={specialtyFilter}
                  setSpecialtyFilter={setSpecialtyFilter}
                  negotiatedRatesFilter={negotiatedRatesFilter}
                  setNegotiatedRatesFilter={setNegotiatedRatesFilter}
                  volumeFilter={volumeFilter}
                  setVolumeFilter={setVolumeFilter}
                  ratingFilter={ratingFilter}
                  setRatingFilter={setRatingFilter}
                  resetFilters={resetFilters}
                  categories={categories}
                  cities={cities}
                  countries={countries}
                  specialties={specialties}
                />
              )}
              <VendorsList vendors={filteredVendors} viewMode={viewMode} groupBy={activeTab} />
            </div>
          )}
      </div>

      <InviteVendorDialog 
        isOpen={isInviteDialogOpen} 
        onOpenChange={setIsInviteDialogOpen} 
      />
    </div>
  );
};

export default Vendors;
