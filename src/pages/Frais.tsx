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
  ReceiptText, Loader2, Sparkles, Pencil, Trash2,
  Coffee, UtensilsCrossed, Moon, CircleUserRound, Video, MapPin, Users,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReceiptVerifyModal, { VerifyPrefill } from '@/components/frais/ReceiptVerifyModal';
import { CATEGORY_META } from '@/components/frais/categoryMeta';
import { toProperCase } from '@/utils/toProperCase';

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

interface TeGuest {
  display_name: string;
  company_name: string | null;
}

interface TeExpense {
  id: string;
  source: 'bank_feed' | 'card_platform' | 'receipt_only' | 'manual';
  merchant_clean: string | null;
  merchant_raw: string | null;
  amount: number;
  amount_ht: number | null;
  currency: string;
  vat_amount: number | null;
  vat_breakdown: { rate: number | null; ht: number | null; tva: number | null }[] | null;
  supplier_siret: string | null;
  supplier_address: string | null;
  supplier_naf: string | null;
  supplier_naf_label: string | null;
  occurred_at: string;
  te_category: 'restaurant' | 'transport' | 'hebergement' | 'autre' | null;
  status: 'new' | 'suggested' | 'confirmed' | 'rejected' | 'no_context' | 'exported';
  reimbursable: boolean;
  receipt_id: string | null;
  verified_at: string | null;
  notes: string | null;
  te_expense_matches: TeMatch[] | null;
  te_expense_guests: TeGuest[] | null;
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
  kanban_bucket: AgendaBucket | null;
  recurring_event_id: string | null;
}

const SYNC_WINDOWS = [
  { value: '30', label: '30 derniers jours' },
  { value: '60', label: '60 derniers jours' },
  { value: '90', label: '90 derniers jours' },
];

// ---- Kanban agenda : classement des RDV par créneau frais ----
// Ordre de résolution : classement manuel (drag & drop, persistant) > règle de
// série récurrente > auto. L'auto : visio d'abord (jamais une NDF), puis libellé
// (mots ENTIERS — « Cafetex » ne matche pas « café »), validé par l'heure, puis
// invités, puis créneau horaire.
type AgendaBucket = 'cafes' | 'dejeuners' | 'diners' | 'perso';

const KW: Record<'perso' | 'visio' | 'cafes' | 'dejeuners' | 'diners', string[]> = {
  perso: ['impôts?', 'impots?', 'déclaration', 'declaration', 'deadline', 'échéance', 'echeance',
    'rappel', 'todo', 'à faire', 'médecin', 'medecin', 'docteur', 'dr', 'pédiatre', 'pediatre',
    'dentiste', 'ophtalmo', 'dermato', 'kiné', 'kine', 'ostéo', 'osteo', 'pharmacie',
    'vétérinaire', 'veterinaire', 'garage', 'contrôle technique', 'controle technique',
    'coiffeur', 'anniversaire', 'vacances', 'congés', 'conges', 'école', 'ecole', 'crèche', 'creche',
    'urssaf', 'banque', 'mairie', 'préfecture', 'prefecture', 'perso', 'sport', 'yoga', 'footing'],
  visio: ['teams', 'microsoft teams', 'zoom', 'google meet', 'meet', 'visio', 'webex', 'hangout', 'call'],
  cafes: ['café', 'cafe', 'coffee', 'petit-déj', 'petit déj', 'petit dej', 'petit-déjeuner', 'petit déjeuner'],
  dejeuners: ['déjeuner', 'dejeuner', 'déj', 'dej', 'lunch', 'restaurant', 'resto'],
  diners: ['dîner', 'diner', 'dinner', 'soirée', 'soiree', 'apéro', 'apero', 'drink', 'drinks'],
};

// Mots entiers uniquement (bordures non alphabétiques) — insensible à la casse.
const kwRegex = (kws: string[]) =>
  new RegExp(`(^|[^\\p{L}])(${kws.join('|')})([^\\p{L}]|$)`, 'iu');
const RX = {
  perso: kwRegex(KW.perso),
  visio: kwRegex(KW.visio),
  cafes: kwRegex(KW.cafes),
  dejeuners: kwRegex(KW.dejeuners),
  diners: kwRegex(KW.diners),
};

function isVisio(ev: AgendaEvent): boolean {
  return RX.visio.test(ev.title ?? '') || RX.visio.test(ev.location_raw ?? '');
}

function classifyEvent(ev: AgendaEvent): AgendaBucket {
  const title = ev.title ?? '';
  const start = new Date(ev.starts_at);
  const h = start.getHours() + start.getMinutes() / 60;

  // 1. Visio (Teams/Zoom/Meet…) : pas de frais possible → à confirmer.
  if (isVisio(ev)) return 'perso';
  // 2. Libellé perso (deadline, pédiatre, impôts…) prime sur tout.
  if (RX.perso.test(title)) return 'perso';
  // 3. Libellé repas, validé par une heure PLAUSIBLE (un « resto » à 20 h ira
  //    en dîner par l'heure ; un « café » à 16 h n'est pas un café).
  if (RX.diners.test(title) && h >= 17 && h < 24) return 'diners';
  if (RX.dejeuners.test(title) && h >= 11 && h < 15.5) return 'dejeuners';
  if (RX.cafes.test(title) && h >= 7 && h < 11.5) return 'cafes';
  // 4. Sans invités → perso / à confirmer.
  if (!Array.isArray(ev.attendees) || ev.attendees.length === 0) return 'perso';
  // 5. Créneau horaire.
  if (h >= 7.5 && h < 10.5) return 'cafes';
  if (h >= 11.75 && h < 14.25) return 'dejeuners';
  if (h >= 18.5 && h < 23) return 'diners';
  return 'perso';
}

const BUCKETS: { key: AgendaBucket; label: string; hint: string; icon: React.ElementType }[] = [
  { key: 'cafes', label: 'Cafés', hint: '8 h – 10 h', icon: Coffee },
  { key: 'dejeuners', label: 'Déjeuners', hint: '12 h – 14 h', icon: UtensilsCrossed },
  { key: 'diners', label: 'Dîners', hint: '19 h – 22 h', icon: Moon },
  { key: 'perso', label: 'Perso / à confirmer', hint: 'visio, sans invités, hors créneaux', icon: CircleUserRound },
];

const SOURCE_LABELS: Record<TeExpense['source'], string> = {
  bank_feed: 'Import banque',
  card_platform: 'Carte',
  receipt_only: 'Reçu photo',
  manual: 'Saisie manuelle',
};

const SIGNAL_LABELS: Record<string, string> = {
  time: 'heure', geo: 'lieu', category: 'type de frais',
  attendees: 'participants', history: 'habitude',
};

const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const VALID_CATEGORIES = ['restaurant', 'transport', 'hebergement', 'autre'];
const str = (v: unknown) => (v == null ? '' : String(v));
// Proper Case (règle fleuron) — les tickets OCR sortent souvent en MAJUSCULES.
const proper = (v: unknown) => (typeof v === 'string' && v.trim() ? toProperCase(v) : '');

// Prefill de la modale de vérification depuis le retour brut de l'OCR
// (juste après l'upload : le frais vient d'être créé côté serveur).
const prefillFromExtracted = (ex: any, expenseId: string, receiptId: string | null): VerifyPrefill => ({
  expenseId,
  receiptId,
  merchant: proper(ex?.merchant),
  siret: str(ex?.siret),
  address: proper(ex?.address),
  naf: '',
  nafLabel: '',
  date: str(ex?.date),
  time: ex?.time && /^([01]\d|2[0-3]):[0-5]\d$/.test(ex.time) ? ex.time : '',
  category: VALID_CATEGORIES.includes(ex?.category) ? ex.category : '',
  totalTTC: str(ex?.amount),
  totalHT: str(ex?.total_ht),
  totalTVA: str(ex?.vat),
  lines: Array.isArray(ex?.vat_lines)
    ? ex.vat_lines.map((l: any) => ({ rate: str(l?.rate), ht: str(l?.ht), tva: str(l?.tva) }))
    : [],
});

// Prefill depuis un frais existant (réouverture via le bouton « Vérifier »).
const prefillFromExpense = (e: TeExpense): VerifyPrefill => {
  // Minuit UTC pile = marqueur « date seule » posé par l'OCR → pas d'heure.
  const dateOnly = /T00:00:00(\.000)?(Z|\+00:00)$/.test(e.occurred_at);
  const d = new Date(e.occurred_at);
  return {
    expenseId: e.id,
    receiptId: e.receipt_id,
    merchant: proper(e.merchant_clean ?? e.merchant_raw),
    siret: e.supplier_siret ?? '',
    address: proper(e.supplier_address),
    naf: e.supplier_naf ?? '',
    nafLabel: e.supplier_naf_label ?? '',
    date: dateOnly ? e.occurred_at.slice(0, 10) : format(d, 'yyyy-MM-dd'),
    time: dateOnly ? '' : format(d, 'HH:mm'),
    category: e.te_category ?? '',
    totalTTC: str(e.amount),
    totalHT: str(e.amount_ht),
    totalTVA: str(e.vat_amount),
    lines: (e.vat_breakdown ?? []).map((l) => ({ rate: str(l.rate), ht: str(l.ht), tva: str(l.tva) })),
  };
};

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
  const [rules, setRules] = useState<Record<string, AgendaBucket>>({});
  const [syncDays, setSyncDays] = useState('30');
  // Modale « série récurrente » : événement déplacé + colonne cible en attente.
  const [seriesMove, setSeriesMove] = useState<{ event: AgendaEvent; bucket: AgendaBucket } | null>(null);
  // Modale de vérification OCR (écran 1) + participants (écran 2).
  const [verify, setVerify] = useState<VerifyPrefill | null>(null);
  // Suppression d'un frais non traité (confirmation) + relance de matching.
  const [toDelete, setToDelete] = useState<TeExpense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rematchingId, setRematchingId] = useState<string | null>(null);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    const [{ data: conn }, { data: exp, error }, { data: evts }, { data: ruleRows }] = await Promise.all([
      db.from('integration_connections')
        .select('id, status, last_synced_at')
        .eq('user_id', uid).eq('provider', 'google_calendar')
        .neq('status', 'revoked')
        .maybeSingle(),
      db.from('te_expenses')
        .select('*, te_expense_matches(id, status, confidence, signals, matched_event_title, matched_event_starts_at, te_calendar_events(title, starts_at, location_raw)), te_expense_guests(display_name, company_name)')
        .eq('user_id', uid)
        .order('occurred_at', { ascending: false }),
      db.from('te_calendar_events')
        .select('id, title, location_raw, starts_at, ends_at, is_external, attendees, kanban_bucket, recurring_event_id')
        .eq('user_id', uid)
        .order('starts_at', { ascending: false })
        .limit(200),
      db.from('te_agenda_rules')
        .select('recurring_event_id, kanban_bucket')
        .eq('user_id', uid),
    ]);
    if (error) {
      // Migration socle pas encore appliquée → tables absentes.
      toast({ title: 'Module Frais non initialisé', description: error.message, variant: 'destructive' });
    }
    setConnection(conn ?? null);
    setExpenses(exp ?? []);
    setAgenda(evts ?? []);
    setRules(Object.fromEntries((ruleRows ?? []).map((r: any) => [r.recurring_event_id, r.kanban_bucket])));
    setLoading(false);
  }, [toast]);

  // Résolution du classement : manuel (persistant) > règle de série > auto.
  const bucketOf = useCallback((ev: AgendaEvent): AgendaBucket => {
    if (ev.kanban_bucket) return ev.kanban_bucket;
    if (ev.recurring_event_id && rules[ev.recurring_event_id]) return rules[ev.recurring_event_id];
    return classifyEvent(ev);
  }, [rules]);

  // Applique un classement (un épisode, ou toute la série via te_agenda_rules).
  const applyBucket = async (ev: AgendaEvent, bucket: AgendaBucket, scope: 'single' | 'series') => {
    if (!userId) return;
    if (scope === 'series' && ev.recurring_event_id) {
      const [{ error: e1 }, { error: e2 }] = await Promise.all([
        db.from('te_agenda_rules').upsert(
          { user_id: userId, recurring_event_id: ev.recurring_event_id, kanban_bucket: bucket },
          { onConflict: 'user_id,recurring_event_id' },
        ),
        db.from('te_calendar_events')
          .update({ kanban_bucket: bucket })
          .eq('user_id', userId)
          .eq('recurring_event_id', ev.recurring_event_id),
      ]);
      if (e1 || e2) {
        toast({ title: 'Erreur', description: (e1 ?? e2)?.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Série reclassée', description: 'Tous les épisodes (passés et à venir) suivront ce classement.' });
    } else {
      const { error } = await db.from('te_calendar_events')
        .update({ kanban_bucket: bucket })
        .eq('id', ev.id);
      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
    }
    loadData(userId);
  };

  const handleDrop = (bucket: AgendaBucket) => (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const ev = agenda.find((a) => a.id === id);
    if (!ev || bucketOf(ev) === bucket) return;
    if (ev.recurring_event_id) {
      setSeriesMove({ event: ev, bucket });
    } else {
      applyBucket(ev, bucket, 'single');
    }
  };

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
      // Écran de vérification : tout ce que l'OCR a lu, éditable avant validation.
      if (data?.expense_id) {
        setVerify(prefillFromExtracted(data.extracted ?? {}, data.expense_id, data.receipt_id ?? receipt.id));
      } else {
        toast({ title: 'Reçu analysé', description: 'Frais créé.' });
      }
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
        merchant_raw: manual.merchant.trim() || null,
        merchant_clean: manual.merchant.trim() ? toProperCase(manual.merchant) : null,
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

  // Supprime un frais non traité + son reçu (ligne et fichier du bucket).
  const deleteExpense = async () => {
    if (!toDelete || !userId) return;
    setDeleting(true);
    try {
      let storagePath: string | null = null;
      if (toDelete.receipt_id) {
        const { data: r } = await db.from('te_receipts')
          .select('storage_path').eq('id', toDelete.receipt_id).maybeSingle();
        storagePath = r?.storage_path ?? null;
      }
      // Le frais d'abord (FK receipt_id), puis le reçu, puis le fichier.
      const { error } = await db.from('te_expenses').delete().eq('id', toDelete.id);
      if (error) throw error;
      if (toDelete.receipt_id) {
        await db.from('te_receipts').delete().eq('id', toDelete.receipt_id);
        if (storagePath) {
          await supabase.storage.from('te-receipts')
            .remove([storagePath.replace(/^te-receipts\//, '')]);
        }
      }
      toast({ title: 'Justificatif supprimé' });
      setToDelete(null);
      loadData(userId);
    } catch (e: any) {
      toast({ title: 'Erreur à la suppression', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // Relance le matching frais ↔ RDV à la demande (ex. après une resynchro agenda).
  const rematch = async (e: TeExpense) => {
    if (!userId) return;
    setRematchingId(e.id);
    const { data, error } = await supabase.functions.invoke('match-expense', {
      body: { expense_id: e.id },
    });
    setRematchingId(null);
    if (error) {
      toast({ title: 'Erreur de matching', description: error.message, variant: 'destructive' });
      return;
    }
    if (data?.status === 'no_context') {
      toast({ title: 'Aucun RDV trouvé', description: 'Aucun rendez-vous ne correspond à ce créneau dans l’agenda synchronisé.' });
    }
    loadData(userId);
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
                  {e.verified_at && <Badge variant="outline" className="border-emerald-300 text-emerald-700">Vérifié</Badge>}
                </div>
                {(e.te_expense_guests?.length ?? 0) > 0 && (
                  <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Avec {e.te_expense_guests!.map((g) =>
                        g.company_name ? `${g.display_name} (${g.company_name})` : g.display_name).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="text-lg font-semibold whitespace-nowrap">{euro(e.amount)}</div>
              <div className="flex items-center">
                {['new', 'no_context'].includes(e.status) && (
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                    title="Relancer la recherche de RDV"
                    onClick={() => rematch(e)} disabled={rematchingId === e.id}
                  >
                    {rematchingId === e.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Sparkles className="h-3.5 w-3.5" />}
                  </Button>
                )}
                {e.status !== 'exported' && (
                  <Button
                    variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => setVerify(prefillFromExpense(e))}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    {e.verified_at ? 'Modifier' : 'Vérifier'}
                  </Button>
                )}
                {['new', 'suggested', 'no_context'].includes(e.status) && (
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Supprimer ce justificatif"
                    onClick={() => setToDelete(e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
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
              ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden"
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
                  const items = agenda.filter((ev) => bucketOf(ev) === bucket.key);
                  const BucketIcon = bucket.icon;
                  return (
                    <div
                      key={bucket.key}
                      className="rounded-lg border bg-muted/30"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop(bucket.key)}
                    >
                      <div className="px-3 py-2 border-b">
                        <div className="text-sm font-semibold flex items-center gap-1.5">
                          <BucketIcon className="h-4 w-4 text-muted-foreground" />
                          {bucket.label}
                          <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{bucket.hint}</div>
                      </div>
                      <div className="p-2 space-y-2 max-h-[420px] overflow-y-auto">
                        {items.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center py-4">Glissez un RDV ici</div>
                        ) : items.map((ev) => {
                          const guests = Array.isArray(ev.attendees) ? ev.attendees.length : 0;
                          return (
                            <div
                              key={ev.id}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('text/plain', ev.id)}
                              className="rounded-md border bg-background p-2 cursor-grab active:cursor-grabbing"
                            >
                              <div className="text-sm font-medium leading-tight">{ev.title ?? '(sans titre)'}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(ev.starts_at), "EEE d MMM · HH:mm", { locale: fr })}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground min-w-0">
                                {isVisio(ev) && (
                                  <span className="flex items-center gap-0.5 shrink-0"><Video className="h-3 w-3" /> visio</span>
                                )}
                                {ev.location_raw && !isVisio(ev) && (
                                  <span className="flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3 shrink-0" /> {ev.location_raw}</span>
                                )}
                                {guests > 0 && (
                                  <span className="flex items-center gap-0.5 shrink-0"><Users className="h-3 w-3" /> {guests}</span>
                                )}
                                {ev.is_external && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">Externe</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Classement auto (visio et libellés perso écartés, mots-clés repas validés par l'heure,
              RDV sans invités à confirmer) — corrigez par glisser-déposer, c'est mémorisé même après
              resynchronisation. Ces RDV servent au rattachement de vos frais, personne d'autre n'y a accès.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vérification du justificatif (écran 1) + participants (écran 2) */}
      {userId && (
        <ReceiptVerifyModal
          open={!!verify}
          userId={userId}
          prefill={verify}
          onClose={() => setVerify(null)}
          onSaved={() => loadData(userId)}
        />
      )}

      {/* Suppression d'un justificatif non traité */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce justificatif ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.merchant_clean ?? toDelete?.merchant_raw ?? 'Frais'} —{' '}
              {toDelete ? euro(toDelete.amount) : ''} » sera supprimé,
              {toDelete?.receipt_id ? ' ainsi que le reçu photo associé.' : ' définitivement.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(ev) => { ev.preventDefault(); deleteExpense(); }}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Événement récurrent déplacé : un épisode ou toute la série ? */}
      <Dialog open={!!seriesMove} onOpenChange={(o) => !o && setSeriesMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Événement récurrent</DialogTitle>
            <DialogDescription>
              « {seriesMove?.event.title ?? '(sans titre)'} » fait partie d'une série.
              Classer tous les épisodes (passés et à venir) en
              « {BUCKETS.find((b) => b.key === seriesMove?.bucket)?.label} », ou seulement celui-ci ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (seriesMove) applyBucket(seriesMove.event, seriesMove.bucket, 'single');
                setSeriesMove(null);
              }}
            >
              Juste celui-ci
            </Button>
            <Button
              onClick={() => {
                if (seriesMove) applyBucket(seriesMove.event, seriesMove.bucket, 'series');
                setSeriesMove(null);
              }}
            >
              Toute la série
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
