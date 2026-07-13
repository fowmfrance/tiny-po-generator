/**
 * Rapprochement flou de noms de fournisseurs (Inc B — dédup).
 *
 * Objectif : à la création d'un fournisseur depuis une transaction bancaire,
 * détecter un fournisseur existant proche (nom saisi vs fournisseurs + libellés
 * d'autres transactions) pour proposer de lier plutôt que de dupliquer.
 * Sans dépendance externe (build Lovable).
 */

// Formes juridiques / suffixes à ignorer dans la comparaison.
const LEGAL_FORMS = new Set([
  'sarl', 'sarlu', 'sas', 'sasu', 'eurl', 'sa', 'sci', 'scop', 'snc',
  'ei', 'eirl', 'sc', 'scm', 'selarl', 'gie', 'gmbh', 'ltd', 'llc',
  'inc', 'co', 'corp', 'bv', 'ag', 'srl', 'spa', 'plc',
]);

// Bruit fréquent des libellés bancaires (Qonto & co.).
const BANK_NOISE = new Set([
  'paiement', 'virement', 'vir', 'prlv', 'prelevement', 'prélèvement',
  'cb', 'carte', 'sepa', 'ref', 'reference', 'référence', 'facture',
  'invoice', 'payment', 'from', 'to', 'via', 'net', 'sarl',
]);

/** Normalise un nom : minuscules, sans accents, sans forme juridique ni bruit bancaire, sans chiffres. */
export function normalizeName(raw: string): string {
  if (!raw) return '';
  const tokens = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacritiques combinés
    .replace(/[^a-z0-9\s]/g, ' ') // ponctuation -> espace
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !/^\d+$/.test(t)) // tokens purement numériques (dates, refs)
    .filter((t) => !LEGAL_FORMS.has(t))
    .filter((t) => !BANK_NOISE.has(t));
  return tokens.join(' ').trim();
}

/** Distance de Levenshtein (DP deux lignes). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Ratio de similarité 0..1 basé sur Levenshtein. */
function levenshteinRatio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

/**
 * Recouvrement de tokens : proportion des tokens du nom le plus court
 * présents dans le plus long. Capte « helder ferreira » ⊂ « helder ferreira film ».
 */
function tokenContainment(a: string, b: string): number {
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let hits = 0;
  for (const t of small) if (big.has(t)) hits++;
  return hits / small.size;
}

/** Similarité combinée 0..1 entre deux noms bruts. */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  return Math.max(levenshteinRatio(na, nb), tokenContainment(na, nb));
}

export interface SupplierMatch<T> {
  supplier: T;
  score: number;
}

/**
 * Fournisseurs existants proches du nom saisi, triés par score décroissant.
 * @param threshold seuil de proposition (0.72 par défaut).
 */
export function findSupplierMatches<T extends { id: string; name: string }>(
  name: string,
  suppliers: T[],
  threshold = 0.72,
): SupplierMatch<T>[] {
  return suppliers
    .map((supplier) => ({ supplier, score: nameSimilarity(name, supplier.name) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

/**
 * Transactions non rattachées dont le libellé correspond au nom cible
 * (rattachement automatique après liaison). Seuil strict (0.85) : on ne
 * rattache en masse que des libellés très proches.
 */
export function findSiblingTransactions<T extends { id: string; qonto_label: string; supplier_id: string | null }>(
  targetName: string,
  transactions: T[],
  threshold = 0.85,
): T[] {
  return transactions.filter(
    (tx) => !tx.supplier_id && nameSimilarity(targetName, tx.qonto_label || '') >= threshold,
  );
}

export interface TransactionMatch<T> {
  transaction: T;
  score: number;
}

export interface TiersLinkProposal {
  txId: string;
  label: string;
  side: string | null;
  amount: number;
  currency: string | null;
  date: string | null;
  kind: 'supplier' | 'client';
  entityId: string;
  entityName: string;
  score: number;
}

interface ProposableTx {
  id: string;
  qonto_label: string | null;
  qonto_side: string | null;
  qonto_amount: number;
  qonto_currency?: string | null;
  qonto_settled_at?: string | null;
  qonto_emitted_at?: string | null;
  supplier_id: string | null;
  client_id: string | null;
}

/**
 * Passe fuzzy post-synchronisation : pour chaque transaction non encore
 * rattachée à un tiers, propose le meilleur fournisseur (décaissement) ou
 * client (encaissement) existant dont le nom ressemble au libellé bancaire.
 * Ex. libellé « FRANCOIS TOUCHARD EI - Touch Prod » → fournisseur « Francois
 * Touchard » déjà présent. Retourne les propositions triées par score.
 */
export function proposeTiersLinks(
  transactions: ProposableTx[],
  suppliers: Array<{ id: string; name: string }>,
  clients: Array<{ id: string; name: string }>,
  threshold = 0.62,
): TiersLinkProposal[] {
  const proposals: TiersLinkProposal[] = [];
  for (const tx of transactions) {
    if (tx.supplier_id || tx.client_id) continue;
    const label = tx.qonto_label || '';
    if (!label) continue;
    const isCredit = tx.qonto_side === 'credit';
    const pool = isCredit ? clients : suppliers;
    let best: { id: string; name: string; score: number } | null = null;
    for (const e of pool) {
      const score = nameSimilarity(label, e.name);
      if (score >= threshold && (!best || score > best.score)) {
        best = { id: e.id, name: e.name, score };
      }
    }
    if (!best) continue;
    proposals.push({
      txId: tx.id,
      label,
      side: tx.qonto_side ?? null,
      amount: tx.qonto_amount,
      currency: tx.qonto_currency ?? null,
      date: tx.qonto_settled_at || tx.qonto_emitted_at || null,
      kind: isCredit ? 'client' : 'supplier',
      entityId: best.id,
      entityName: best.name,
      score: best.score,
    });
  }
  return proposals.sort((a, b) => b.score - a.score);
}

/**
 * Transactions non rattachées à suggérer pour un tiers donné, triées par score
 * décroissant. Seuil plus permissif (0.55) que {@link findSiblingTransactions}
 * car ces suggestions sont confirmées à la main (un clic « Rattacher ») et non
 * rattachées en masse silencieusement.
 */
export function findTransactionSuggestions<T extends { id: string; qonto_label: string | null }>(
  targetName: string,
  transactions: T[],
  threshold = 0.55,
  limit = 20,
): TransactionMatch<T>[] {
  return transactions
    .map((transaction) => ({ transaction, score: nameSimilarity(targetName, transaction.qonto_label || '') }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
