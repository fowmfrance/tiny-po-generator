// Politiques maison des notes de frais (table te_expense_policies, config
// admin dans Paramètres → Notes de frais). Évaluation CLIENT-SIDE et purement
// indicative : badge « Non conforme » sur la carte + filtre reporting — on
// n'empêche jamais l'enregistrement d'un frais.
import { CalendarClock, FileQuestion, Gift, UtensilsCrossed, Wine } from 'lucide-react';
import type { ElementType } from 'react';

export type PolicyKey =
  | 'receipt_max_age_days'
  | 'no_receipt_max_amount'
  | 'restaurant_max_per_person'
  | 'gift_max_amount'
  | 'alcohol_forbidden';

export interface PolicyRow {
  policy_key: PolicyKey;
  enabled: boolean;
  threshold: number | null;
}

export const POLICY_META: Record<PolicyKey, {
  label: string;
  hint: string;
  icon: ElementType;
  /** null = politique on/off sans seuil. */
  unit: string | null;
  defaultThreshold: number | null;
}> = {
  receipt_max_age_days: {
    label: 'Délai de soumission du reçu',
    hint: 'Un frais saisi plus de X jours après la dépense est signalé.',
    icon: CalendarClock, unit: 'jours', defaultThreshold: 30,
  },
  no_receipt_max_amount: {
    label: 'Justificatif perdu toléré jusqu’à',
    hint: 'Au-delà de ce montant, un frais sans justificatif est signalé (0 = jamais toléré).',
    icon: FileQuestion, unit: '€', defaultThreshold: 30,
  },
  restaurant_max_per_person: {
    label: 'Plafond restaurant par personne',
    hint: 'TTC divisé par le nombre de convives (participants + le payeur).',
    icon: UtensilsCrossed, unit: '€/pers.', defaultThreshold: 60,
  },
  gift_max_amount: {
    label: 'Plafond par cadeau',
    hint: 'Un frais de type « Cadeau » au-delà de ce montant est signalé.',
    icon: Gift, unit: '€', defaultThreshold: 73,
  },
  alcohol_forbidden: {
    label: 'Alcool signalé',
    hint: 'Tout frais marqué « contient de l’alcool » est signalé.',
    icon: Wine, unit: null, defaultThreshold: null,
  },
};

export const POLICY_KEYS = Object.keys(POLICY_META) as PolicyKey[];

// Sous-ensemble d'un frais nécessaire à l'évaluation (structurellement
// compatible avec TeExpense de la page et ReportExpense du reporting).
export interface PolicyExpense {
  amount: number;
  te_category: string | null;
  receipt_id?: string | null;
  created_at?: string | null;
  occurred_at: string;
  has_alcohol?: boolean;
  te_expense_guests?: { display_name: string }[] | null;
}

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// Violations lisibles, affichées telles quelles (tooltip du badge, CSV).
export function violationsOf(e: PolicyExpense, policies: PolicyRow[]): string[] {
  const v: string[] = [];
  for (const p of policies) {
    if (!p.enabled) continue;
    const t = p.threshold;
    switch (p.policy_key) {
      case 'receipt_max_age_days': {
        if (t == null || !e.created_at) break;
        const days = Math.floor(
          (new Date(e.created_at).getTime() - new Date(e.occurred_at).getTime()) / 86400e3);
        if (days > t) v.push(`Soumis ${days} j après la dépense (max ${t} j)`);
        break;
      }
      case 'no_receipt_max_amount': {
        if (t == null) break;
        if (!e.receipt_id && Number(e.amount) > t) {
          v.push(t > 0 ? `Sans justificatif au-delà de ${eur(t)}` : 'Sans justificatif');
        }
        break;
      }
      case 'restaurant_max_per_person': {
        if (t == null || e.te_category !== 'restaurant') break;
        const persons = (e.te_expense_guests?.length ?? 0) + 1; // + le payeur
        const perHead = Number(e.amount) / persons;
        if (perHead > t) v.push(`${eur(perHead)}/pers. au restaurant (max ${eur(t)})`);
        break;
      }
      case 'gift_max_amount': {
        if (t == null || e.te_category !== 'cadeau') break;
        if (Number(e.amount) > t) v.push(`Cadeau de ${eur(Number(e.amount))} (max ${eur(t)})`);
        break;
      }
      case 'alcohol_forbidden': {
        if (e.has_alcohol) v.push('Contient de l’alcool');
        break;
      }
    }
  }
  return v;
}
