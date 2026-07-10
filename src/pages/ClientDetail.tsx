import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, ArrowDownLeft } from 'lucide-react';

interface ClientDetailProps {
  clientId: string;
  embedded?: boolean;
}

interface ClientTx {
  id: string;
  qonto_label: string | null;
  qonto_amount: number;
  qonto_currency: string | null;
  qonto_settled_at: string | null;
  qonto_emitted_at: string | null;
}

const fmt = (amount: number, currency: string | null) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(amount);

/**
 * Fiche client minimale (Inc « Tiers ») : nom + encaissements rattachés.
 * La table `clients` ne porte que le nom ; la valeur ajoutée est l'historique
 * des transactions liées.
 */
const ClientDetail = ({ clientId, embedded = false }: ClientDetailProps) => {
  const [name, setName] = useState<string>('');
  const [txs, setTxs] = useState<ClientTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: client }, { data: transactions }] = await Promise.all([
        supabase.from('clients').select('name').eq('id', clientId).single(),
        supabase
          .from('transactions')
          .select('id, qonto_label, qonto_amount, qonto_currency, qonto_settled_at, qonto_emitted_at')
          .eq('client_id', clientId)
          .order('qonto_settled_at', { ascending: false }),
      ]);
      if (!active) return;
      setName(client?.name ?? 'Client');
      setTxs((transactions || []) as ClientTx[]);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [clientId]);

  const total = txs.reduce((sum, t) => sum + (t.qonto_amount || 0), 0);
  const currency = txs[0]?.qonto_currency || 'EUR';

  return (
    <div className={embedded ? '' : 'p-6'}>
      <div className="flex items-center gap-3 mb-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-brand shrink-0">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-serif">{name}</h2>
          <p className="text-sm text-muted-foreground">Client — {txs.length} encaissement(s)</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
          <span className="text-sm font-medium">Encaissements rattachés</span>
          <span className="text-sm font-semibold tabular-nums text-green-600">{fmt(total, currency)}</span>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : txs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune transaction rattachée.</p>
        ) : (
          <ul className="divide-y divide-border">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <ArrowDownLeft className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="truncate">{t.qonto_label || 'Sans libellé'}</span>
                </span>
                <span className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.qonto_settled_at || t.qonto_emitted_at || '').toLocaleDateString('fr-FR')}
                  </span>
                  <span className="tabular-nums font-medium">{fmt(t.qonto_amount, t.qonto_currency)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;
