// Module Notes de frais — vue « À traiter » (Sprint 1).
// Frais terrain (T&E) de l'équipe : repas, transports, hébergements.
// ⚠️ Distinct du reste de Sapajoo : rien à voir avec les factures fournisseurs
// (Paiements), les BdC ou les budgets. Tables dédiées préfixées te_.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, CalendarCheck2, Camera, RefreshCw, Check, X, Plus,
  Utensils, CarTaxiFront, BedDouble, ReceiptText, Loader2, Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Tables te_* pas encore dans les types générés (migration appliquée à la main
// dans Lovable, types régénérés ensuite) → client non typé, interfaces locales.
const db = supabase as any;

interface TeCalendarEvent {
  title: string | null;
  starts_at: string;
  location_raw: string | null;
}

interface TeMatch {
  id: string;
  status: 'suggested' | 'confirmed' | 'rejected' | 'auto_confirmed';
  confidence: number;
  signals: Record<string, number>;
  matched_event_title: string | null;
  matched_event_starts_at: string | null;
  te_calendar_events: TeCalendarEvent | null;
}

interface TeExpense {
  id: string;
  source: 'bank_feed' | 'card_platform' | 'receipt_only' | 'manual';
  merchant_clean: string | null;
  merchant_raw: string | null;
  amount: number;
  currency: string;
  occurred_at: string;
  te_category: 'restaurant' | 'transport' | 'hebergement' | 'autre' | null;
  status: 'new' | 'suggested' | 'confirmed' | 'rejected' | 'no_context' | 'exported';
  reimbursable: boolean;
  notes: string | null;
  te_expense_matches: TeMatch[] | null;
}

interface Connection {
  id: string;
  status: string;
  last_synced_at: string | null;
}

interface AgendaEvent {
  id: string;
  title: string | null;
  location_raw: string | null;
  starts_at: string;
  ends_at: string;
  is_external: boolean;
  attendees: unknown[] | null;
}

const SYNC_WINDOWS = [
  { value: '30', label: '30 derniers jours' },
  { value: '60', label: '60 derniers jours' },
  { value: '90', label: '90 derniers jours' },
];

// ---- Kanban agenda : classement des RDV par créneau frais ----
// L'analyse du libellé prime sur l'heure (« faire déclaration d'impôts » posé
// sur un créneau déjeuner = perso, pas un RDV frais).
type AgendaBucket = 'cafes' | 'dejeuners' | 'diners' | 'perso';

const KW = {
  perso: ['impôt', 'impot', 'déclaration', 'declaration', 'médecin', 'medecin', 'dentiste',
    'kiné', 'kine', 'ostéo', 'osteo', 'coiffeur', 'anniversaire', 'vacances', 'congés', 'conges',
    'école', 'ecole', 'crèche', 'creche', 'urssaf', 'banque', 'perso', 'sport', 'yoga', 'footing', 'course'],
  cafes: ['café', 'cafe', 'coffee', 'petit-déj', 'petit déj', 'petit dej'],
  dejeuners: ['déjeuner', 'dejeuner', 'déj ', 'dej ', 'lunch', 'restaurant', 'resto'],
  diners: ['dîner', 'diner', 'dinner', 'soirée', 'soiree'],
};

function classifyEvent(ev: AgendaEvent): AgendaBucket {
  const title = (ev.title ?? '').toLowerCase();
  if (KW.perso.some((k) => title.includes(k))) return 'perso';
  if (KW.diners.some((k) => title.includes(k))) return 'diners';
  if (KW.dejeuners.some((k) => title.includes(k))) return 'dejeuners';
  if (KW.cafes.some((k) => title.includes(k))) return 'cafes';
  // Sans invités → perso / à confirmer
  if (!Array.isArray(ev.attendees) || ev.attendees.length === 0) return 'perso';
  const start = new Date(ev.starts_at);
  const h = start.getHours() + start.getMinutes() / 60;
  if (h >= 8 && h < 10.5) return 'cafes';
  if (h >= 11.5 && h < 15) return 'dejeuners';
  if (h >= 18.5 && h < 23) return 'diners';
  return 'perso';
}

const BUCKETS: { key: AgendaBucket; label: string; hint: string }[] = [
  { key: 'cafes', label: '☕ Cafés', hint: '8 h – 10 h' },
  { key: 'dejeuners', label: '🍽 Déjeuners', hint: '12 h – 14 h' },
  { key: 'diners', label: '🌙 Dîners', hint: '19 h – 22 h' },
  { key: 'perso', label: 'Perso / à confirmer', hint: 'sans invités ou hors créneaux' },
];

const SOURCE_LABELS: Record<TeExpense['source'], string> = {
  bank_feed: 'Import banque',
  card_platform: 'Carte',
  receipt_only: 'Reçu photo',
  manual: 'Saisie manuelle',
};

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType }> = {
  restaurant: { label: 'Restaurant', icon: Utensils },
  transport: { label: 'Transport', icon: CarTaxiFront },
  hebergement: { label: 'Hébergement', icon: BedDouble },
  autre: { label: 'Autre', icon: ReceiptText },
};

const SIGNAL_LABELS: Record<string, string> = {
  time: 'heure', geo: 'lieu', category: 'type de frais',
  attendees: 'participants', history: 'habitude',
};

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const Frais = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [expenses, setExpenses] = useState<TeExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ merchant: '', amount: '', date: '', time: '12:30', category: 'restaurant', notes: '' });
  const [savingManual, setSavingManual] = useState(false);
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [syncDays, setSyncDays] = useState('30');

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    const [{ data: conn }, { data: exp, error }, { data: evts }] = await Promise.all([
      db.from('integration_connections')
        .select('id, status, last_synced_at')
        .eq('user_id', uid).eq('provider', 'google_calendar')
        .neq('status', 'revoked')
        .maybeSingle(),
      db.from('te_expenses')
        .select('*, te_expense_matches(id, status, confidence, signals, matched_event_title, matched_event_starts_at, te_calendar_events(title, starts_at, location_raw))')
        .eq('user_id', uid)
        .order('occurred_at', { ascending: false }),
      db.from('te_calendar_events')
        .select('id, title, location_raw, starts_at, ends_at, is_external, attendees')
        .eq('user_id', uid)
        .order('starts_at', { ascending: false })
        .limit(200),
    ]);
    if (error) {
      // Migration socle pas encore appliquée → tables absentes.
      toast({ title: 'Module Frais non initialisé', description: error.message, variant: 'destructive' });
    }
    setConnection(conn ?? null);
    setExpenses(exp ?? []);
    setAgenda(evts ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await loadData(user.id);
    })();
  }, [loadData]);

  // Retour du flux OAuth Google (?connexion=ok|refusee|erreur)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get('connexion');
    if (!c) return;
    if (c === 'ok') toast({ title: 'Agenda connecté', description: 'La première synchronisation est en cours.' });
    else if (c === 'refusee') toast({ title: 'Connexion refusée', description: "Vous avez refusé l'accès à l'agenda.", variant: 'destructive' });
    else toast({ title: 'Erreur de connexion agenda', variant: 'destructive' });
    window.history.replaceState({}, '', '/frais');
  }, [toast]);

  const connectCalendar = async () => {
    const { data, error } = await supabase.functions.invoke('google-oauth-start');
    if (error || !data?.url) {
      toast({ title: 'Erreur', description: "Impossible de démarrer la connexion Google.", variant: 'destructive' });
      return;
    }
    window.location.href = data.url;
  };

  const syncCalendar = async () => {
    if (!connection || !userId) return;
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke('sync-calendar', {
      body: { connection_id: connection.id, days_back: Number(syncDays) },
    });
    setSyncing(false);
    if (error) {
      toast({ title: 'Erreur de synchronisation', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Agenda synchronisé', description: `${data?.upserts ?? 0} événement(s) mis à jour.` });
    loadData(userId);
  };

  const uploadReceipt = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('te-receipts').upload(path, file);
      if (upErr) throw upErr;
      const { data: receipt, error: insErr } = await db.from('te_receipts')
        .insert({ user_id: userId, storage_path: path })
        .select('id').single();
      if (insErr) throw insErr;
      const { data, error: fnErr } = await supabase.functions.invoke('ocr-receipt', {
        body: { receipt_id: receipt.id },
      });
      if (fnErr) throw fnErr;
      const ex = data?.extracted;
      toast({
        title: 'Reçu analysé',
        description: ex ? `${ex.merchant ?? '?'} — ${euro(ex.amount ?? 0)}` : 'Frais créé.',
      });
      loadData(userId);
    } catch (e: any) {
      toast({ title: "Échec de l'analyse du reçu", description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createManual = async () => {
    if (!userId || !manual.amount || !manual.date) return;
    setSavingManual(true);
    try {
      const occurredAt = new Date(`${manual.date}T${manual.time || '12:00'}:00`);
      const { data: created, error } = await db.from('te_expenses').insert({
        user_id: userId,
        source: 'manual',
        merchant_raw: manual.merchant || null,
        merchant_clean: manual.merchant || null,
        amount: Number(manual.amount),
        occurred_at: occurredAt.toISOString(),
        te_category: manual.category,
        notes: manual.notes || null,
        reimbursable: true,
        reimbursement_status: 'pending',
      }).select('id').single();
      if (error) throw error;
      await supabase.functions.invoke('match-expense', { body: { expense_id: created.id } });
      toast({ title: 'Frais ajouté', description: 'Recherche du RDV correspondant…' });
      setManualOpen(false);
      setManual({ merchant: '', amount: '', date: '', time: '12:30', category: 'restaurant', notes: '' });
      loadData(userId);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setSavingManual(false);
    }
  };

  const decideMatch = async (expense: TeExpense, match: TeMatch, decision: 'confirmed' | 'rejected') => {
    if (!userId) return;
    const { error: mErr } = await db.from('te_expense_matches')
      .update({ status: decision, decided_by: userId, decided_at: new Date().toISOString() })
      .eq('id', match.id);
    const { error: eErr } = await db.from('te_expenses')
      .update({ status: decision === 'confirmed' ? 'confirmed' : 'no_context' })
      .eq('id', expense.id);
    if (mErr || eErr) {
      toast({ title: 'Erreur', description: (mErr ?? eErr)?.message, variant: 'destructive' });
      return;
    }
    toast({ title: decision === 'confirmed' ? 'Rattachement confirmé' : 'Suggestion rejetée' });
    loadData(userId);
  };

  const pending = expenses.filter((e) => ['new', 'suggested', 'no_context'].includes(e.status));
  const done = expenses.filter((e) => ['confirmed', 'exported', 'rejected'].includes(e.status));

  const renderSignals = (signals: Record<string, number>) => {
    const active = Object.entries(signals ?? {})
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([k]) => SIGNAL_LABELS[k] ?? k);
    return active.length ? active.join(' + ') : '—';
  };

  const renderExpense = (e: TeExpense) => {
    const match = e.te_expense_matches?.[0] ?? null;
    const cat = e.te_category ? CATEGORY_META[e.te_category] : null;
    const CatIcon = cat?.icon ?? ReceiptText;
    const event = match?.te_calendar_events;
    const eventTitle = event?.title ?? match?.matched_event_title;
    const eventStart = event?.starts_at ?? match?.matched_event_starts_at;

    return (
      <Card key={e.id}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="rounded-lg bg-muted p-2 shrink-0">
                <CatIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {e.merchant_clean ?? e.merchant_raw ?? 'Marchand inconnu'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(e.occurred_at), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge variant="outline">{SOURCE_LABELS[e.source]}</Badge>
                  {cat && <Badge variant="outline">{cat.label}</Badge>}
                  {e.reimbursable && <Badge variant="secondary">À rembourser</Badge>}
                  {e.status === 'confirmed' && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Rattaché</Badge>}
                  {e.status === 'no_context' && <Badge variant="secondary">Sans RDV trouvé</Badge>}
                </div>
              </div>
            </div>
            <div className="text-lg font-semibold whitespace-nowrap">{euro(e.amount)}</div>
          </div>

          {match && match.status === 'suggested' && eventTitle != null && (
            <div className="mt-3 rounded-lg border bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2 min-w-0">
                  <Sparkles className="h-4 w-4 mt-0.5 text-brand shrink-0" />
                  <div className="text-sm min-w-0">
                    <span className="font-medium">{eventTitle}</span>
                    {eventStart && (
                      <span className="text-muted-foreground">
                        {' '}· {format(new Date(eventStart), "d MMM HH:mm", { locale: fr })}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Correspondance {Math.round(match.confidence)} % · {renderSignals(match.signals)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => decideMatch(e, match, 'confirmed')}>
                    <Check className="h-4 w-4 mr-1" /> Confirmer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decideMatch(e, match, 'rejected')}>
                    <X className="h-4 w-4 mr-1" /> Rejeter
                  </Button>
                </div>
              </div>
            </div>
          )}

          {e.status === 'confirmed' && (eventTitle || match?.matched_event_title) && (
            <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4 shrink-0" />
              <span className="truncate">
                Rattaché à « {eventTitle ?? match?.matched_event_title} »
                {eventStart && ` · ${format(new Date(eventStart), 'd MMM HH:mm', { locale: fr })}`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Notes de frais | Frais terrain & attribution</title>
        <meta name="description" content="Notes de frais terrain (repas, transports, hébergements) rattachées automatiquement à vos rendez-vous." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="h-7 w-7" /> Notes de frais
            </h1>
            <p className="text-muted-foreground">
              Frais terrain de l'équipe (repas, transports, hébergements), rattachés à vos rendez-vous.
              Les factures fournisseurs restent dans l'onglet Paiements.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Saisie manuelle
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
              Ajouter un reçu
            </Button>
            <input
              ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(ev) => ev.target.files?.[0] && uploadReceipt(ev.target.files[0])}
            />
          </div>
        </div>

        {/* Connexion agenda */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck2 className="h-4 w-4" /> Agenda Google
            </CardTitle>
            <CardDescription>
              Votre agenda sert uniquement à rattacher vos frais à vos rendez-vous.
              Il reste personnel : personne d'autre n'y a accès.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between flex-wrap gap-3">
            {connection ? (
              <>
                <div className="text-sm text-muted-foreground">
                  {connection.status === 'active' ? 'Connecté' : `Statut : ${connection.status}`}
                  {` · ${agenda.length} RDV synchronisé${agenda.length > 1 ? 's' : ''}`}
                  {connection.last_synced_at &&
                    ` · dernière synchro ${format(new Date(connection.last_synced_at), 'd MMM HH:mm', { locale: fr })}`}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={syncDays} onValueChange={setSyncDays}>
                    <SelectTrigger className="h-8 w-[170px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SYNC_WINDOWS.map((w) => (
                        <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={syncCalendar} disabled={syncing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Synchroniser
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Connectez votre agenda pour que vos frais se rattachent tout seuls à vos RDV.
                </div>
                <Button size="sm" onClick={connectCalendar}>Connecter mon agenda</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Listes */}
        <Tabs defaultValue="agenda">
          <TabsList>
            <TabsTrigger value="agenda">
              Agenda{agenda.length > 0 && ` (${agenda.length})`}
            </TabsTrigger>
            <TabsTrigger value="pending">
              À traiter{pending.length > 0 && ` (${pending.length})`}
            </TabsTrigger>
            <TabsTrigger value="done">Traités</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-muted-foreground text-sm py-8 text-center">Chargement…</div>
            ) : pending.length === 0 ? (
              <div className="text-muted-foreground text-sm py-8 text-center">
                Rien à traiter. Ajoutez un reçu ou attendez la prochaine synchronisation.
              </div>
            ) : pending.map(renderExpense)}
          </TabsContent>
          <TabsContent value="done" className="space-y-3 mt-4">
            {done.length === 0 ? (
              <div className="text-muted-foreground text-sm py-8 text-center">Aucun frais traité pour l'instant.</div>
            ) : done.map(renderExpense)}
          </TabsContent>
          <TabsContent value="agenda" className="mt-4">
            {agenda.length === 0 ? (
              <div className="text-muted-foreground text-sm py-8 text-center">
                Aucun RDV synchronisé. Connectez votre agenda ou lancez une synchronisation.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                {BUCKETS.map((bucket) => {
                  const items = agenda.filter((ev) => classifyEvent(ev) === bucket.key);
                  return (
                    <div key={bucket.key} className="rounded-lg border bg-muted/30">
                      <div className="px-3 py-2 border-b">
                        <div className="text-sm font-semibold">
                          {bucket.label}
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">({items.length})</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{bucket.hint}</div>
                      </div>
                      <div className="p-2 space-y-2 max-h-[420px] overflow-y-auto">
                        {items.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-4">—</div>
                        ) : items.map((ev) => (
                          <div key={ev.id} className="rounded-md border bg-background p-2">
                            <div className="text-sm font-medium leading-tight">{ev.title ?? '(sans titre)'}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(ev.starts_at), "EEE d MMM · HH:mm", { locale: fr })}
                              {ev.location_raw && ` · ${ev.location_raw}`}
                            </div>
                            {ev.is_external && (
                              <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">Externe</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Classement automatique par libellé puis créneau (un RDV sans invités part en
              « Perso / à confirmer »). Ces RDV servent au rattachement de vos frais — personne
              d'autre n'y a accès.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Saisie manuelle */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau frais</DialogTitle>
            <DialogDescription>
              Un frais terrain payé de votre poche ou sans reçu exploitable —
              pas une facture fournisseur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="frais-merchant">Marchand</Label>
              <Input id="frais-merchant" placeholder="Le Pantruche" value={manual.merchant}
                onChange={(e) => setManual({ ...manual, merchant: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="frais-amount">Montant TTC (€)</Label>
                <Input id="frais-amount" type="number" step="0.01" min="0" value={manual.amount}
                  onChange={(e) => setManual({ ...manual, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type de frais</Label>
                <Select value={manual.category} onValueChange={(v) => setManual({ ...manual, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="frais-date">Date</Label>
                <Input id="frais-date" type="date" value={manual.date}
                  onChange={(e) => setManual({ ...manual, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="frais-time">Heure</Label>
                <Input id="frais-time" type="time" value={manual.time}
                  onChange={(e) => setManual({ ...manual, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="frais-notes">Notes</Label>
              <Input id="frais-notes" placeholder="Déjeuner prospection…" value={manual.notes}
                onChange={(e) => setManual({ ...manual, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Annuler</Button>
            <Button onClick={createManual} disabled={savingManual || !manual.amount || !manual.date}>
              {savingManual && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Frais;
