// Liaison budget ↔ Google Sheet : carte de contrôle sur la fiche budget.
// Sapajoo est la source de vérité — le Sheet est CONTRÔLÉ (total comparé,
// écart alerté), jamais synchronisé en silence.
// v1 : mode service_account — l'utilisateur partage son Sheet en lecture avec
// l'email du compte de service ; le message d'erreur 403 de l'edge function
// rappelle ce geste avec l'email exact.
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, CheckCircle2, ExternalLink, FileSpreadsheet, Loader2, RefreshCw, Unlink,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Colonnes sheet_* hors types générés (migration manuelle Lovable).
const db = supabase as any;

interface SheetLinkRow {
  sheet_spreadsheet_id: string | null;
  sheet_status: string | null;
  sheet_last_total: number | null;
  sheet_checked_at: string | null;
  sheet_error: string | null;
}

const SHEET_URL_RE = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

const money = (n: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);

interface Props {
  budgetId: string;
  currency: string;
  initialAmount: number;
}

const BudgetSheetLink: React.FC<Props> = ({ budgetId, currency, initialAmount }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: link } = useQuery<SheetLinkRow | null>({
    queryKey: ['budget-sheet-link', budgetId],
    queryFn: async () => {
      const { data } = await db.from('budgets')
        .select('sheet_spreadsheet_id, sheet_status, sheet_last_total, sheet_checked_at, sheet_error')
        .eq('id', budgetId)
        .maybeSingle();
      return data ?? null;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['budget-sheet-link', budgetId] });

  const runCheck = async () => {
    const { data, error } = await supabase.functions.invoke('sync-budget-sheets', {
      body: { budget_id: budgetId },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const linkSheet = async () => {
    const m = url.match(SHEET_URL_RE);
    if (!m) {
      toast({ title: 'URL invalide', description: "Collez l'URL complète du Google Sheet (docs.google.com/spreadsheets/d/…).", variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { error } = await db.from('budgets')
        .update({ sheet_spreadsheet_id: m[1], sheet_status: 'pending', sheet_error: null })
        .eq('id', budgetId);
      if (error) throw error;
      await runCheck();
      setUrl('');
      refresh();
    } catch (e: any) {
      toast({ title: 'Liaison impossible', description: e.message ?? String(e), variant: 'destructive' });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const verifyNow = async () => {
    setBusy(true);
    try {
      await runCheck();
      refresh();
    } catch (e: any) {
      toast({ title: 'Contrôle impossible', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    setBusy(true);
    const { error } = await db.from('budgets')
      .update({
        sheet_spreadsheet_id: null, sheet_status: null, sheet_last_total: null,
        sheet_checked_at: null, sheet_error: null,
      })
      .eq('id', budgetId);
    setBusy(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    refresh();
  };

  const delta = link?.sheet_last_total != null ? link.sheet_last_total - initialAmount : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" /> Google Sheet lié
        </CardTitle>
        <CardDescription>
          Contrôle quotidien : le total du Sheet (plage nommée <code>SAPAJOO_TOTAL</code>) est
          comparé au budget Sapajoo. En cas d'écart, on alerte — on ne synchronise jamais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!link?.sheet_spreadsheet_id ? (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') linkSheet(); }}
              />
              <Button onClick={linkSheet} disabled={busy || !url.trim()} className="shrink-0">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Lier
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              1. Dans le Sheet : Données → Plages nommées → nommez la cellule du total{' '}
              <code>SAPAJOO_TOTAL</code> (et, recommandé, une cellule <code>SAPAJOO_CODE</code> avec
              le code de ce budget). 2. Partagez le fichier en <b>lecture</b> avec le compte de
              service Sapajoo. 3. Collez l'URL ici — le premier contrôle vous dira s'il manque
              quelque chose.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1 min-w-0">
                {link.sheet_status === 'ok' && (
                  <div className="flex items-center gap-1.5 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Conforme au Sheet — {money(link.sheet_last_total ?? 0, currency)}
                  </div>
                )}
                {link.sheet_status === 'mismatch' && delta != null && (
                  <div className="flex items-start gap-1.5 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Écart : le Sheet annonce <b>{money(link.sheet_last_total ?? 0, currency)}</b>,
                      Sapajoo <b>{money(initialAmount, currency)}</b>{' '}
                      ({delta > 0 ? '+' : ''}{money(delta, currency)})
                    </span>
                  </div>
                )}
                {link.sheet_status === 'code_mismatch' && (
                  <div className="flex items-start gap-1.5 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{link.sheet_error ?? 'Le code du Sheet ne correspond pas à ce budget.'}</span>
                  </div>
                )}
                {link.sheet_status === 'error' && (
                  <div className="flex items-start gap-1.5 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{link.sheet_error ?? 'Contrôle en échec.'}</span>
                  </div>
                )}
                {link.sheet_status === 'pending' && (
                  <div className="text-sm text-muted-foreground">Premier contrôle en attente…</div>
                )}
                {link.sheet_checked_at && (
                  <div className="text-[11px] text-muted-foreground">
                    Dernier contrôle {format(new Date(link.sheet_checked_at), "d MMM 'à' HH:mm", { locale: fr })}
                    {' '}· contrôle automatique chaque matin
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="sm" onClick={verifyNow} disabled={busy}>
                  {busy
                    ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    : <RefreshCw className="h-4 w-4 mr-1.5" />}
                  Vérifier
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${link.sheet_spreadsheet_id}`}
                    target="_blank" rel="noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" /> Ouvrir
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={unlink} disabled={busy}>
                  <Unlink className="h-4 w-4 mr-1.5" /> Délier
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetSheetLink;
