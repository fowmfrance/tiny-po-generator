// Régimes de TVA des comptes clients (ventes) — liste fermée, miroir du CHECK
// de la migration 20261015120000. Règle d'or du module compta : trésorerie =
// TTC, P&L = HT, et `amount_ht` importé de Qonto reste LA vérité comptable.
// Le régime sert de CONTRÔLE de cohérence (alerte si le HT facturé ne colle
// pas), jamais de recalcul silencieux.
//
// Badges : pastille bordée + texte couleur d'encre (jamais de fond plein).

export type VatRegime =
  | 'standard_fr_20'
  | 'reduced_fr_10'
  | 'reduced_fr_55'
  | 'exempt'
  | 'intracom'
  | 'export';

export const VAT_REGIMES: Record<VatRegime, { label: string; rate: number; badgeClass: string }> = {
  standard_fr_20: { label: 'France 20 %', rate: 0.20, badgeClass: 'border-blue-300 text-blue-700' },
  reduced_fr_10: { label: 'France 10 %', rate: 0.10, badgeClass: 'border-indigo-300 text-indigo-700' },
  reduced_fr_55: { label: 'France 5,5 %', rate: 0.055, badgeClass: 'border-indigo-300 text-indigo-700' },
  exempt: { label: 'Exonéré (art. 261 CGI)', rate: 0, badgeClass: 'border-emerald-300 text-emerald-700' },
  intracom: { label: 'Intracommunautaire', rate: 0, badgeClass: 'border-purple-300 text-purple-700' },
  export: { label: 'Export (hors UE)', rate: 0, badgeClass: 'border-amber-400 text-amber-700' },
};

export const VAT_REGIME_KEYS = Object.keys(VAT_REGIMES) as VatRegime[];

export const isVatRegime = (v: unknown): v is VatRegime =>
  typeof v === 'string' && v in VAT_REGIMES;

/**
 * HT théorique à partir du TTC et du régime. Préserve le signe (avoirs
 * négatifs). Usage : CONTRÔLE de cohérence face au HT importé, ou calcul
 * de secours quand une source ne fournit que le TTC.
 */
export function computeHTFromTTC(amountTTC: number, regime: VatRegime = 'standard_fr_20'): {
  amountHT: number;
  vatAmount: number;
} {
  const sign = amountTTC < 0 ? -1 : 1;
  const absTTC = Math.abs(amountTTC);
  const { rate } = VAT_REGIMES[regime] ?? VAT_REGIMES.standard_fr_20;
  const absHT = rate === 0 ? absTTC : Math.round((absTTC / (1 + rate)) * 100) / 100;
  const absVAT = Math.round((absTTC - absHT) * 100) / 100;
  return { amountHT: sign * absHT, vatAmount: sign * absVAT };
}

/**
 * Le HT facturé colle-t-il au régime ? Tolérance : 5 centimes ou 0,1 % du TTC
 * (arrondis ligne à ligne des factures multi-lignes Qonto).
 */
export function htMatchesRegime(amountTTC: number, amountHT: number, regime: VatRegime): boolean {
  const { amountHT: expected } = computeHTFromTTC(amountTTC, regime);
  const tol = Math.max(0.05, Math.abs(amountTTC) * 0.001);
  return Math.abs(amountHT - expected) <= tol;
}

// UE-27 hors France (clients assujettis → autoliquidation intracom).
const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'GR', 'EL',
  'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO',
  'SE', 'SI', 'SK',
]);

/**
 * Régime par défaut déduit du pays du client (calibré sur les ventes FOWM :
 * FR → 20 %, BE/DK → intracom, CH → export). Les taux réduits se posent à la
 * main sur le compte.
 */
export function inferVatRegime(countryCode?: string | null): VatRegime {
  const cc = (countryCode ?? '').trim().toUpperCase();
  if (!cc || cc === 'FR') return 'standard_fr_20';
  if (EU_COUNTRIES.has(cc)) return 'intracom';
  return 'export';
}
