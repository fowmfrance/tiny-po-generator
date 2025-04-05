
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Filter, Activity, MapPin, Globe } from 'lucide-react';
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
  resetFilters: () => void;
  categories: string[];
  cities: string[];
  countries: string[];
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
  resetFilters,
  categories,
  cities,
  countries
}: VendorFiltersProps) => {
  
  const activeFiltersCount = [categoryFilter, statusFilter, countryFilter, cityFilter]
    .filter(f => f !== 'all').length;

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
          <span className="bg-po-blue text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ml-1">
            {activeFiltersCount}
          </span>
        )}
      </Button>

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
    </>
  );
};

export default VendorFilters;
