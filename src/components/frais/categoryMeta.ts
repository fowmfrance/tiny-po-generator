// Types de frais du module Notes de frais (vocabulaire fermé te_category).
// Partagé entre la page Frais et la modale de vérification.
import { BedDouble, CarTaxiFront, ReceiptText, Utensils } from 'lucide-react';
import type { ElementType } from 'react';

export const CATEGORY_META: Record<string, { label: string; icon: ElementType }> = {
  restaurant: { label: 'Restaurant', icon: Utensils },
  transport: { label: 'Transport', icon: CarTaxiFront },
  hebergement: { label: 'Hébergement', icon: BedDouble },
  autre: { label: 'Autre', icon: ReceiptText },
};
