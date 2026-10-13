/**
 * Moteur de reconnaissance d'un budget selon sa méthode (`recognition_methods.code`).
 *
 * Pur (aucun accès Supabase) : le bloc Reconnaissance lui passe les BdC et les
 * factures fournisseurs du budget, il renvoie les charges reconnues à date et
 * l'avancement qui pilote le CA. La provision (FNP) ou le rabot (CCA / en-cours)
 * restent calculés par différentiel avec le comptabilisé, comme avant.
 *
 * Méthodes modélisées :
 * - over_time_linear   : provision de charges × % de la période écoulée (doctrine par défaut).
 * - point_in_time      : direct matching — chaque BdC est reconnu en totalité à sa date de
 *                        livraison (prévue, sinon 1re facture, sinon date de fin du projet) ;
 *                        le CA suit au même rythme.
 * - poc_cost_to_cost   : avancement = coûts encourus (livrés) / coûts totaux estimés.
 * - completed_contract : rien avant la date de fin, tout à la date de fin.
 * Les autres méthodes (jalons, efforts, encaissement, actes) ne sont pas encore
 * modélisées : repli linéaire signalé comme indicatif (`modelled: false`).
 */

export type RecognitionMethodCode =
  | 'over_time_linear'
  | 'point_in_time'
  | 'poc_cost_to_cost'
  | 'poc_efforts'
  | 'poc_milestone'
  | 'completed_contract'
  | 'collection'
  | 'proportional';

export interface RecoPurchaseOrder {
  id: string;
  amountHt: number;
  status: string;
  expectedDeliveryDate: string | null;
}

export interface RecoSupplierInvoice {
  amountHt: number;
  invoiceDate: string | null;
  purchaseOrderId: string | null;
}

export interface RecoInput {
  methodCode: string | null | undefined;
  startDate: string;
  endDate: string;
  /** Provision de charges du budget (HT). */
  initialAmount: number;
  purchaseOrders: RecoPurchaseOrder[];
  invoices: RecoSupplierInvoice[];
  now?: number;
}

export interface RecoResult {
  /** false → méthode non modélisée : chiffres linéaires indicatifs. */
  modelled: boolean;
  methodCode: string;
  /** Fraction de la période écoulée (axe du temps, curseur Aujourd'hui). */
  elapsed: number;
  /** Fraction reconnue (0..1) — appliquée au prix de vente pour le CA. */
  progress: number;
  /** Charges reconnues à date (HT). */
  chargesReconnues: number;
  /** Échelle de la barre charges (HT). */
  chargesTotal: number;
  /** Factures fournisseurs comptabilisées (HT). */
  comptabilise: number;
  /** Coûts engagés connus : max(BdC, facturé) par BdC + factures hors BdC (HT). */
  engage: number;
  /** Libellé du rabot quand le comptabilisé dépasse le reconnu. */
  rabotLabel: string;
  /** Sous-titre du bloc. */
  description: string;
  /** Libellé du curseur reconnu. */
  progressLabel: string;
}

/** Statuts de BdC qui ne portent aucun coût. */
const DEAD_PO_STATUSES = new Set(['cancelled', 'rejected']);

const toTime = (iso: string) => new Date(iso).getTime();
const pct = (x: number) => `${Math.round(x * 100)} %`;

export function computeRecognition(input: RecoInput): RecoResult {
  const now = input.now ?? Date.now();
  const start = toTime(input.startDate);
  const end = toTime(input.endDate);
  const span = end - start;
  const elapsed = span > 0 ? Math.min(1, Math.max(0, (now - start) / span)) : now >= end ? 1 : 0;
  const initial = Math.max(0, input.initialAmount || 0);

  const comptabilise = input.invoices.reduce((s, inv) => s + (inv.amountHt || 0), 0);

  // ——— Coûts par ligne d'engagement, avec leur date de transfert de contrôle ———
  const livePos = input.purchaseOrders.filter(po => !DEAD_PO_STATUSES.has(po.status));
  const livePoIds = new Set(livePos.map(po => po.id));
  const invoicesByPo = new Map<string, RecoSupplierInvoice[]>();
  const horsBdc: RecoSupplierInvoice[] = [];
  for (const inv of input.invoices) {
    if (inv.purchaseOrderId && livePoIds.has(inv.purchaseOrderId)) {
      const list = invoicesByPo.get(inv.purchaseOrderId) ?? [];
      list.push(inv);
      invoicesByPo.set(inv.purchaseOrderId, list);
    } else {
      horsBdc.push(inv);
    }
  }

  const lines: { cost: number; controlAt: number }[] = [];
  for (const po of livePos) {
    const invs = invoicesByPo.get(po.id) ?? [];
    const invoiced = invs.reduce((s, inv) => s + (inv.amountHt || 0), 0);
    const firstInvoiceDate = invs
      .map(inv => inv.invoiceDate)
      .filter((d): d is string => !!d)
      .sort()[0];
    const controlDate = po.expectedDeliveryDate ?? firstInvoiceDate ?? input.endDate;
    lines.push({ cost: Math.max(po.amountHt || 0, invoiced), controlAt: toTime(controlDate) });
  }
  for (const inv of horsBdc) {
    lines.push({ cost: inv.amountHt || 0, controlAt: toTime(inv.invoiceDate ?? input.endDate) });
  }

  const engage = lines.reduce((s, l) => s + l.cost, 0);
  const livre = lines.filter(l => l.controlAt <= now).reduce((s, l) => s + l.cost, 0);

  const base = { methodCode: input.methodCode ?? 'over_time_linear', elapsed, comptabilise, engage };

  const linear = (modelled: boolean, description: string): RecoResult => ({
    ...base,
    modelled,
    progress: elapsed,
    chargesReconnues: initial * elapsed,
    chargesTotal: initial,
    rabotLabel: 'CCA',
    description,
    progressLabel: `Reconnu (${pct(elapsed)} de la période)`,
  });

  switch (input.methodCode ?? 'over_time_linear') {
    case 'over_time_linear':
      return linear(true, 'Linéaire entre les dates du projet — provisions par différentiel d\'engagement.');

    case 'point_in_time': {
      const progress = engage > 0 ? livre / engage : now >= end ? 1 : 0;
      return {
        ...base,
        modelled: true,
        progress,
        chargesReconnues: livre,
        chargesTotal: Math.max(initial, engage),
        rabotLabel: 'CCA',
        description:
          'Direct matching — chaque BdC est reconnu en totalité à sa date de livraison, le CA au même rythme.',
        progressLabel: `Reconnu (${pct(progress)} livré)`,
      };
    }

    case 'poc_cost_to_cost': {
      const estimated = Math.max(initial, engage);
      const progress = estimated > 0 ? Math.min(1, livre / estimated) : 0;
      return {
        ...base,
        modelled: true,
        progress,
        chargesReconnues: livre,
        chargesTotal: estimated,
        rabotLabel: 'CCA',
        description: 'Cost-to-cost — avancement = coûts encourus / coûts totaux estimés ; le CA suit l\'avancement.',
        progressLabel: `Avancement ${pct(progress)}`,
      };
    }

    case 'completed_contract': {
      const done = now >= end;
      return {
        ...base,
        modelled: true,
        progress: done ? 1 : 0,
        chargesReconnues: done ? engage : 0,
        chargesTotal: Math.max(initial, engage),
        rabotLabel: 'En-cours',
        description: 'Contrat achevé — rien n\'est reconnu avant la date de fin du projet, tout l\'est à cette date.',
        progressLabel: done ? 'Achevé — tout est reconnu' : 'Non achevé — rien de reconnu',
      };
    }

    default:
      return linear(
        false,
        'Cette méthode n\'est pas encore modélisée dans ce bloc — affichage linéaire indicatif, à ne pas utiliser pour la clôture.',
      );
  }
}
