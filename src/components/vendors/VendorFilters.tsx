
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Filter, Activity, MapPin, Globe, Star, Handshake, TrendingUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VendorFiltersProps {
  showFilters: boolean;
  toggleFilters: () => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  countryFilter: string;
  setCountryFilter: (value: string) => void;
  specialtyFilter: string;
  setSpecialtyFilter: (value: string) => void;
  negotiatedRatesFilter: string;
  setNegotiatedRatesFilter: (value: string) => void;
  volumeFilter: string;
  setVolumeFilter: (value: string) => void;
  ratingFilter: string;
  setRatingFilter: (value: string) => void;
  resetFilters: () => void;
  categories: string[];
  cities: string[];
  countries: string[];
  specialties: string[];
}

const VendorFilters = ({ 
  showFilters,
  toggleFilters,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  cityFilter,
  setCityFilter,
  countryFilter,
  setCountryFilter,
  specialtyFilter,
  setSpecialtyFilter,
  negotiatedRatesFilter,
  setNegotiatedRatesFilter,
  volumeFilter,
  setVolumeFilter,
  ratingFilter,
  setRatingFilter,
  resetFilters,
  categories,
  cities,
  countries,
  specialties
}: VendorFiltersProps) => {
  
  const activeFiltersCount = [
    categoryFilter, 
    statusFilter, 
    countryFilter, 
    cityFilter,
    specialtyFilter,
    negotiatedRatesFilter,
    volumeFilter,
    ratingFilter
  ].filter(f => f !== 'all').length;

  return (
    <>
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={toggleFilters}
      >
        <Filter className="w-4 h-4" />
        Filtres
        {activeFiltersCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center ml-1">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {showFilters && (
        <div className="bg-muted/50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Spécialité */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Spécialité
              </Label>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes spécialités" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty === 'all' ? 'Toutes spécialités' : specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tarifs négociés */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                Tarifs négociés
              </Label>
              <Select value={negotiatedRatesFilter} onValueChange={setNegotiatedRatesFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="yes">Avec tarifs négociés</SelectItem>
                  <SelectItem value="no">Sans tarifs négociés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Volume d'affaires */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Volume d'affaires
              </Label>
              <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous volumes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous volumes</SelectItem>
                  <SelectItem value="low">&lt; 10 000 €</SelectItem>
                  <SelectItem value="medium">10 000 € - 50 000 €</SelectItem>
                  <SelectItem value="high">50 000 € - 100 000 €</SelectItem>
                  <SelectItem value="very-high">&gt; 100 000 €</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                Note minimum
              </Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes notes" />
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

            {/* Catégorie */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Catégorie
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'Toutes les catégories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Statut */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />
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
            
            {/* Ville */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
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
            
            {/* Pays */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
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
    </>
  );
};

export default VendorFilters;
