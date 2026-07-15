import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List, Clapperboard, Building2, Paperclip } from 'lucide-react';
import VendorCard from './VendorCard';
import { Vendor } from '@/types/vendor';
import { toProperCase } from '@/utils/properCase';
import { SupplierTypeIcon } from '@/components/ui/supplier-type-icon';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Mail, Phone, Star, Building, ShieldOff, Handshake, CreditCard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface VendorsListProps {
  vendors: Vendor[];
  viewMode?: 'grid' | 'list';
}

type ViewMode = 'grid' | 'list';

// Grouping logic
type VendorGroup = 'projets' | 'services' | 'mixte';

const SERVICE_CATEGORIES = ['Services généraux', 'IT', 'Juridique & Comptabilité', 'Voyage'];

function getVendorGroup(vendor: Vendor): VendorGroup {
  if (SERVICE_CATEGORIES.includes(vendor.category)) return 'services';
  if (vendor.category === 'Non classé') return 'mixte';
  return 'projets';
}

const GROUP_LABELS: Record<VendorGroup, string> = {
  projets: 'Projets',
  services: 'Services généraux',
  mixte: 'Mixte / Non classé',
};

const GROUP_ICONS: Record<VendorGroup, React.ElementType> = {
  projets: Clapperboard,
  services: Building2,
  mixte: Paperclip,
};

const GROUP_ORDER: VendorGroup[] = ['projets', 'services', 'mixte'];

function groupVendors(vendors: Vendor[]): Record<VendorGroup, Vendor[]> {
  const groups: Record<VendorGroup, Vendor[]> = { projets: [], services: [], mixte: [] };
  vendors.forEach(v => groups[getVendorGroup(v)].push(v));
  return groups;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);

const VendorsList = ({ vendors, viewMode: externalViewMode }: VendorsListProps) => {
  const [internalViewMode, setViewMode] = useState<ViewMode>('grid');
  const viewMode = externalViewMode ?? internalViewMode;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ projets: true, services: true, mixte: true });
  const navigate = useNavigate();

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  if (vendors.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-500 mb-4">Aucun fournisseur trouvé.</p>
        <Link to="/vendors/new">
          <Button className="bg-po-blue hover:bg-blue-600 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un Fournisseur
          </Button>
        </Link>
      </div>
    );
  }

  const grouped = groupVendors(vendors);

  return (
    <div className="space-y-2">
      {/* View toggle - only show if no external viewMode provided */}
      {!externalViewMode && (
        <div className="flex justify-end">
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
      )}

      {GROUP_ORDER.map(groupKey => {
        const groupVendors = grouped[groupKey];
        if (groupVendors.length === 0) return null;
        const isOpen = openGroups[groupKey] ?? true;

        return (
          <Collapsible key={groupKey} open={isOpen} onOpenChange={() => toggleGroup(groupKey)}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 hover:bg-muted/50 rounded-md transition-colors">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-semibold text-base flex items-center gap-1.5">
                {React.createElement(GROUP_ICONS[groupKey], { className: 'h-4 w-4 text-muted-foreground' })}
                {GROUP_LABELS[groupKey]}
              </span>
              <Badge variant="secondary" className="text-xs ml-1">{groupVendors.length}</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-2">
                  {groupVendors.map(vendor => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border mt-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Nom</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-center w-[60px]">Contact</TableHead>
                        <TableHead className="text-center">BdC</TableHead>
                        <TableHead className="text-right">YTD</TableHead>
                        <TableHead className="text-right">N-1</TableHead>
                        <TableHead className="text-center">Note</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupVendors.map(vendor => {
                        const hasEmail = !!vendor.email && vendor.email.trim() !== '' && !vendor.email.includes('.temp');
                        const hasPhone = !!vendor.phone && vendor.phone.trim() !== '';
                        return (
                          <TableRow
                            key={vendor.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/vendors/${vendor.id}`)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1.5">
                                {vendor.hasNegotiatedRates && <Handshake className="h-3 w-3 text-green-600 flex-shrink-0" />}
                                {vendor.isPOExempt && <ShieldOff className="h-3 w-3 text-amber-600 flex-shrink-0" />}
                                <span className="truncate">{toProperCase(vendor.name)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <SupplierTypeIcon iconName={vendor.supplierTypeIcon} className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{vendor.category}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Mail className={`h-3.5 w-3.5 ${hasEmail ? 'text-muted-foreground' : 'text-muted-foreground/20'}`} strokeWidth={hasEmail ? 2.5 : 1.5} />
                                  </TooltipTrigger>
                                  <TooltipContent>{hasEmail ? vendor.email : 'Pas d\'email'}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Phone className={`h-3.5 w-3.5 ${hasPhone ? 'text-muted-foreground' : 'text-muted-foreground/20'}`} strokeWidth={hasPhone ? 2.5 : 1.5} />
                                  </TooltipTrigger>
                                  <TooltipContent>{hasPhone ? vendor.phone : 'Pas de téléphone'}</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs">{vendor.totalPOs}</TableCell>
                            <TableCell className="text-right text-xs">
                              {(vendor.ytdAmount || 0) > 0 ? formatCurrency(vendor.ytdAmount!) : '—'}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {(vendor.prevYearAmount || 0) > 0 ? formatCurrency(vendor.prevYearAmount!) : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {(vendor.averageRating || 0) > 0 ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">{vendor.averageRating!.toFixed(1)}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {vendor.status === 'active' && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                              {vendor.status === 'inactive' && <span className="w-2 h-2 rounded-full bg-muted-foreground/30 inline-block" />}
                              {vendor.status === 'pending' && <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default VendorsList;
