/**
 * Libellés français des catégories legacy Qonto (slugs anglais à underscore).
 *
 * La classification riche (cashflow_category, en français) est prioritaire à
 * l'affichage ; cette table ne sert que de FALLBACK pour les opérations que
 * Qonto n'a pas encore catégorisées — plus jamais de `restaurant_and_bar` brut
 * à l'écran. Les slugs inconnus passent par un humanisateur générique.
 */
const QONTO_CATEGORY_LABELS: Record<string, string> = {
  atm: 'Retrait',
  fees: 'Frais bancaires',
  finance: 'Finance',
  food_and_grocery: 'Alimentation',
  gas_station: 'Carburant',
  hardware_and_equipment: 'Équipement et matériel',
  hotel_and_lodging: 'Hôtel et hébergement',
  insurance: 'Assurance',
  it_and_electronics: 'Informatique et électronique',
  legal_and_accounting: 'Juridique et comptabilité',
  logistics: 'Logistique',
  manufacturing: 'Production',
  marketing: 'Marketing',
  office_rental: 'Loyer de bureau',
  office_supply: 'Fournitures de bureau',
  online_service: 'Services en ligne',
  other_expense: 'Autre dépense',
  other_income: 'Autre revenu',
  other_service: 'Autre service',
  refund: 'Remboursement',
  restaurant_and_bar: 'Restaurant et bar',
  salary: 'Salaires',
  sales: 'Ventes',
  subscription: 'Abonnement',
  tax: 'Impôts et taxes',
  transport: 'Transport',
  travel: 'Déplacement',
  treasury_and_interco: 'Trésorerie et intra-groupe',
  utility: 'Énergie et services',
  voucher: 'Titres de paiement',
};

export const qontoCategoryLabel = (slug: string | null | undefined): string | null => {
  if (!slug) return null;
  return QONTO_CATEGORY_LABELS[slug]
    ?? slug.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
};
