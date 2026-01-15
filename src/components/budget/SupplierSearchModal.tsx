import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, UserPlus, Star, MapPin, Handshake, TrendingUp, X, Check, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface SupplierResult {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  supplier_type_id?: string | null;
  supplierTypeName?: string;
  city?: string | null;
  country?: string | null;
  has_negotiated_rates?: boolean | null;
  business_volume?: number | null;
  averageRating?: number;
}

interface SupplierSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierSelect: (supplier: SupplierResult) => void;
  onInviteNew: () => void;
  expectedSupplierTypeId?: string | null;
  expectedSupplierTypeName?: string;
}

export const SupplierSearchModal: React.FC<SupplierSearchModalProps> = ({
  open,
  onOpenChange,
  onSupplierSelect,
  onInviteNew,
  expectedSupplierTypeId,
  expectedSupplierTypeName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [negotiatedFilter, setNegotiatedFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResult | null>(null);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedSupplier(null);
      setShowMismatchWarning(false);
      // Pre-filter by expected type if provided
      if (expectedSupplierTypeId) {
        setTypeFilter(expectedSupplierTypeId);
      } else {
        setTypeFilter('all');
      }
    }
  }, [open, expectedSupplierTypeId]);

  // Fetch supplier types
  const { data: supplierTypes = [] } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_types')
        .select('id, name, color')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch suppliers with ratings
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers-search', open],
    queryFn: async () => {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select(`
          id, name, email, phone, specialty, supplier_type_id,
          city, country, has_negotiated_rates, business_volume,
          supplier_types (name)
        `)
        .eq('is_active', true)
        .order('name');
      
      if (suppliersError) throw suppliersError;

      // Fetch ratings
      const { data: ratingsData } = await supabase
        .from('supplier_ratings')
        .select('supplier_id, rating');

      // Calculate average rating per supplier
      const ratingsBySupplier: Record<string, number[]> = {};
      ratingsData?.forEach(r => {
        if (!ratingsBySupplier[r.supplier_id]) {
          ratingsBySupplier[r.supplier_id] = [];
        }
        ratingsBySupplier[r.supplier_id].push(r.rating);
      });

      return suppliersData.map(s => ({
        ...s,
        supplierTypeName: (s.supplier_types as any)?.name || null,
        averageRating: ratingsBySupplier[s.id] 
          ? ratingsBySupplier[s.id].reduce((a, b) => a + b, 0) / ratingsBySupplier[s.id].length
          : undefined,
      })) as SupplierResult[];
    },
    enabled: open,
  });

  // Get unique cities for filter
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(suppliers.filter(s => s.city).map(s => s.city!))];
    return uniqueCities.sort();
  }, [suppliers]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = supplier.name.toLowerCase().includes(query);
        const matchesEmail = supplier.email.toLowerCase().includes(query);
        const matchesSpecialty = supplier.specialty?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesSpecialty) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && supplier.supplier_type_id !== typeFilter) return false;

      // Rating filter
      if (ratingFilter !== 'all') {
        const minRating = parseFloat(ratingFilter);
        if (!supplier.averageRating || supplier.averageRating < minRating) return false;
      }

      // Volume filter
      if (volumeFilter !== 'all') {
        const volume = supplier.business_volume || 0;
        switch (volumeFilter) {
          case 'low': if (volume >= 10000) return false; break;
          case 'medium': if (volume < 10000 || volume > 50000) return false; break;
          case 'high': if (volume < 50000 || volume > 100000) return false; break;
          case 'very-high': if (volume <= 100000) return false; break;
        }
      }

      // Negotiated rates filter
      if (negotiatedFilter !== 'all') {
        if (negotiatedFilter === 'yes' && !supplier.has_negotiated_rates) return false;
        if (negotiatedFilter === 'no' && supplier.has_negotiated_rates) return false;
      }

      // City filter
      if (cityFilter !== 'all' && supplier.city !== cityFilter) return false;

      return true;
    });
  }, [suppliers, searchQuery, typeFilter, ratingFilter, volumeFilter, negotiatedFilter, cityFilter]);

  const handleSupplierClick = (supplier: SupplierResult) => {
    setSelectedSupplier(supplier);
    
    // Check for type mismatch
    if (expectedSupplierTypeId && supplier.supplier_type_id !== expectedSupplierTypeId) {
      setShowMismatchWarning(true);
    } else {
      setShowMismatchWarning(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedSupplier) {
      onSupplierSelect(selectedSupplier);
      onOpenChange(false);
    }
  };

  const handleInviteClick = () => {
    onInviteNew();
    onOpenChange(false);
  };

  const resetFilters = () => {
    setTypeFilter(expectedSupplierTypeId || 'all');
    setRatingFilter('all');
    setVolumeFilter('all');
    setNegotiatedFilter('all');
    setCityFilter('all');
  };

  const activeFiltersCount = [typeFilter, ratingFilter, volumeFilter, negotiatedFilter, cityFilter]
    .filter(f => f !== 'all').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Rechercher un fournisseur
          </DialogTitle>
          <DialogDescription>
            Recherchez un fournisseur existant ou invitez-en un nouveau
            {expectedSupplierTypeName && (
              <span className="ml-1">
                (type attendu : <strong>{expectedSupplierTypeName}</strong>)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-muted/50 p-4 rounded-lg border space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {/* Type filter */}
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {supplierTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Star className="h-3 w-3" /> Note min
                  </Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes notes</SelectItem>
                      <SelectItem value="4.5">⭐ 4.5+</SelectItem>
                      <SelectItem value="4">⭐ 4+</SelectItem>
                      <SelectItem value="3.5">⭐ 3.5+</SelectItem>
                      <SelectItem value="3">⭐ 3+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Volume filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Volume
                  </Label>
                  <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous volumes</SelectItem>
                      <SelectItem value="low">&lt; 10k €</SelectItem>
                      <SelectItem value="medium">10-50k €</SelectItem>
                      <SelectItem value="high">50-100k €</SelectItem>
                      <SelectItem value="very-high">&gt; 100k €</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Negotiated rates filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Handshake className="h-3 w-3" /> Tarifs
                  </Label>
                  <Select value={negotiatedFilter} onValueChange={setNegotiatedFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="yes">Négociés</SelectItem>
                      <SelectItem value="no">Non négociés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* City filter */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Ville
                  </Label>
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes villes</SelectItem>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          )}

          {/* Results list */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-2 space-y-1">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun fournisseur trouvé</p>
                  <p className="text-sm mt-1">Essayez de modifier vos critères ou invitez un nouveau fournisseur</p>
                </div>
              ) : (
                filteredSuppliers.map(supplier => (
                  <div
                    key={supplier.id}
                    onClick={() => handleSupplierClick(supplier)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedSupplier?.id === supplier.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    {/* Selection indicator */}
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      selectedSupplier?.id === supplier.id
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {selectedSupplier?.id === supplier.id && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>

                    {/* Supplier info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{supplier.name}</span>
                        {supplier.supplierTypeName && (
                          <Badge variant="outline" className="text-xs">
                            {supplier.supplierTypeName}
                          </Badge>
                        )}
                        {supplier.has_negotiated_rates && (
                          <Badge variant="secondary" className="text-xs">
                            <Handshake className="h-3 w-3 mr-1" />
                            Négocié
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{supplier.email}</span>
                        {supplier.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {supplier.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating & Volume */}
                    <div className="text-right flex-shrink-0">
                      {supplier.averageRating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{supplier.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                      {supplier.business_volume && supplier.business_volume > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR',
                            maximumFractionDigits: 0 
                          }).format(supplier.business_volume)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Type mismatch warning */}
          {showMismatchWarning && selectedSupplier && (
            <Alert variant="destructive" className="bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800 dark:text-orange-200">Type de fournisseur différent</AlertTitle>
              <AlertDescription className="text-orange-700 dark:text-orange-300">
                Le fournisseur "{selectedSupplier.name}" est de type "{selectedSupplier.supplierTypeName || 'Non défini'}" 
                mais ce bloc a été créé pour le type "{expectedSupplierTypeName}".
              </AlertDescription>
            </Alert>
          )}

          {/* Invite new supplier CTA */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed">
            <div>
              <p className="text-sm font-medium">Fournisseur introuvable ?</p>
              <p className="text-xs text-muted-foreground">
                Invitez un nouveau fournisseur à rejoindre votre catalogue
              </p>
            </div>
            <Button variant="outline" onClick={handleInviteClick}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter un fournisseur
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedSupplier}
            variant={showMismatchWarning ? "destructive" : "default"}
          >
            {showMismatchWarning ? "Affecter quand même" : "Sélectionner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
