// Modale de vérification post-upload d'un justificatif (module Notes de frais).
// Le document (photo ou PDF) reste AFFICHÉ à gauche, zoomable, pendant toute la
// vérification — on contrôle les taux de TVA en regardant le ticket.
// Écran 1 « Vérification » : données OCR éditables (date, fournisseur, SIRET,
//   adresse, NAF, ventilation TVA par taux) + sanity checks bottom-up
//   (somme des lignes vs totaux) et top-down (HT + TVA = TTC, cohérence par taux).
//   Lookup SIRENE (sous-modale, pattern fusion retail_shops) en fallback quand
//   l'OCR n'a pas su extraire l'adresse, ou à la demande.
// Écran 2 « Qui participe » : lookup multi-select des invités (te_contacts) +
//   suggestions automatiques depuis le RDV rattaché (invités du RDV, prénoms
//   du titre en fuzzy match), entreprise remontée du contact et éditable.
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Building2, CalendarCheck2, Check, CheckCircle2,
  Landmark, Loader2, Plus, Search, Sparkles, Trash2, UserRound, Users, Wand2, X,
  ZoomIn, ZoomOut,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_META } from './categoryMeta';
import SireneFraisDialog, { SireneFields } from './SireneFraisDialog';
import { toProperCase } from '@/utils/toProperCase';

const db = supabase as any;

export interface VatLineDraft { rate: string; ht: string; tva: string }

export interface VerifyPrefill {
  expenseId: string;
  receiptId: string | null;
  merchant: string;
  siret: string;
  address: string;
  naf: string;
  nafLabel: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  category: string;
  totalTTC: string;
  totalHT: string;
  totalTVA: string;
  lines: VatLineDraft[];
}

interface Guest {
  contactId: string | null;
  displayName: string;
  email: string | null;
  companyName: string;
  // Entreprise du contact au moment de la sélection : si l'utilisateur la
  // corrige ici, on propage la correction dans te_contacts (carnet).
  originalCompany: string | null;
}

interface ContactRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  company_name: string | null;
  company_domain: string | null;
}

interface GuestSuggestion {
  contact: ContactRow | null;
  name: string;
  email: string | null;
  company: string;
}

// Candidat RDV proposé depuis la date/heure du justificatif (écran 1).
interface EventChoice {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  attendees: unknown[] | null;
  location_raw: string | null;
}

// Saisie FR tolérée (« 85,50 ») ; NaN si vide/invalide.
const num = (s: string): number => parseFloat(s.replace(/\s/g, '').replace(',', '.'));
const has = (s: string) => s.trim() !== '' && !Number.isNaN(num(s));
const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
// Tolérance d'arrondi : 1 centime par ligne agrégée, minimum 2 centimes.
const close = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol + 1e-9;

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const contactName = (c: ContactRow) =>
  c.display_name
  || [c.first_name, c.last_name].filter(Boolean).join(' ')
  || c.email;

const contactCompany = (c: ContactRow) => c.company_name ?? c.company_domain ?? '';

// Mots du titre d'un RDV qui ne sont PAS des prénoms (créneaux repas, liaisons…).
const TITLE_STOPWORDS = new Set([
  'dej', 'dejeuner', 'diner', 'dinner', 'lunch', 'cafe', 'coffee', 'petit',
  'resto', 'restaurant', 'apero', 'drink', 'drinks', 'soiree', 'brunch',
  'avec', 'chez', 'et', 'les', 'des', 'the', 'and', 'with', 'pour', 'sur',
  'point', 'call', 'visio', 'meet', 'meeting', 'rdv', 'rendez', 'vous', 'reunion',
]);

interface Props {
  open: boolean;
  userId: string;
  prefill: VerifyPrefill | null;
  onClose: () => void;
  onSaved: () => void;
}

const ReceiptVerifyModal: React.FC<Props> = ({ open, userId, prefill, onClose, onSaved }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // --- Document (photo/PDF du bucket privé, URL signée 1 h) ---
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docIsPdf, setDocIsPdf] = useState(false);
  const [zoom, setZoom] = useState(1);

  // --- Écran 1 : données du justificatif ---
  const [merchant, setMerchant] = useState('');
  const [siret, setSiret] = useState('');
  const [address, setAddress] = useState('');
  const [naf, setNaf] = useState('');
  const [nafLabel, setNafLabel] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [totalTTC, setTotalTTC] = useState('');
  const [totalHT, setTotalHT] = useState('');
  const [totalTVA, setTotalTVA] = useState('');
  const [lines, setLines] = useState<VatLineDraft[]>([]);
  const [sireneOpen, setSireneOpen] = useState(false);

  // --- RDV correspondant (lookup agenda depuis la date/heure du justificatif) ---
  // 'none' = choix explicite « aucun RDV » ; null = pas encore choisi.
  const [eventChoices, setEventChoices] = useState<EventChoice[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | 'none' | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  // true dès que l'utilisateur a cliqué lui-même (on ne re-présélectionne plus).
  const [eventChosenByUser, setEventChosenByUser] = useState(false);
  const [existingMatchEventId, setExistingMatchEventId] = useState<string | null>(null);

  // --- Écran 2 : participants ---
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContactRow[]>([]);
  // Carnet Gmail (People API via enrich-contacts {search}) : couvre les contacts
  // jamais invités à un RDV synchronisé, donc absents de te_contacts.
  const [googleResults, setGoogleResults] = useState<{ name: string; email: string | null; company: string | null }[]>([]);
  // Pourquoi le carnet Gmail ne répond pas : 'scope' (reconnecter l'agenda),
  // 'api_disabled' (activer People API côté Google Cloud), 'no_connection'…
  const [blocked, setBlocked] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [eventCtx, setEventCtx] = useState<{ title: string | null; attendees: unknown[] } | null>(null);
  const [contactPool, setContactPool] = useState<ContactRow[]>([]);

  // (Re)charge le prefill + les invités déjà enregistrés à l'ouverture.
  useEffect(() => {
    if (!open || !prefill) return;
    setStep(1);
    setMerchant(prefill.merchant);
    setSiret(prefill.siret);
    setAddress(prefill.address);
    setNaf(prefill.naf);
    setNafLabel(prefill.nafLabel);
    setDate(prefill.date);
    setTime(prefill.time);
    setCategory(prefill.category);
    setTotalTTC(prefill.totalTTC);
    setTotalHT(prefill.totalHT);
    setTotalTVA(prefill.totalTVA);
    setLines(prefill.lines.length ? prefill.lines : [{ rate: '', ht: '', tva: '' }]);
    setQuery('');
    setResults([]);
    setGuests([]);
    setEventCtx(null);
    setEventChoices([]);
    setSelectedEventId(null);
    setEventChosenByUser(false);
    setExistingMatchEventId(null);
    // Fallback SIRENE : SIRET lu mais adresse manquante → lookup proposé d'office.
    setSireneOpen(!!prefill.siret && !prefill.address);
    // Match existant (suggestion moteur ou confirmation passée) → présélection.
    db.from('te_expense_matches')
      .select('calendar_event_id, status')
      .eq('expense_id', prefill.expenseId)
      .neq('status', 'rejected')
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.calendar_event_id) setExistingMatchEventId(data.calendar_event_id);
      });
    db.from('te_expense_guests')
      .select('contact_id, display_name, email, company_name')
      .eq('expense_id', prefill.expenseId)
      .then(({ data }: any) => {
        if (data?.length) {
          setGuests(data.map((g: any) => ({
            contactId: g.contact_id,
            displayName: g.display_name,
            email: g.email,
            companyName: g.company_name ?? '',
            originalCompany: g.company_name ?? null,
          })));
        }
      });
  }, [open, prefill]);

  // URL signée du justificatif (bucket privé te-receipts).
  useEffect(() => {
    if (!open || !prefill?.receiptId) { setDocUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data: r } = await db.from('te_receipts')
        .select('storage_path').eq('id', prefill.receiptId).maybeSingle();
      if (!r?.storage_path || cancelled) return;
      const path = r.storage_path.replace(/^te-receipts\//, '');
      const { data: s } = await supabase.storage.from('te-receipts').createSignedUrl(path, 3600);
      if (cancelled || !s?.signedUrl) return;
      setDocIsPdf(/\.pdf(\?|$)/i.test(path));
      setZoom(1);
      setDocUrl(s.signedUrl);
    })();
    return () => { cancelled = true; };
  }, [open, prefill?.receiptId]);

  // Lookup agenda depuis les indices du justificatif (date + heure) — même
  // fenêtre que le moteur match-expense : chevauchement [T−5h, T+1h30], ou la
  // journée entière si l'heure manque. Réactif : corriger la date/heure
  // recharge les candidats. Debounce 300 ms.
  useEffect(() => {
    if (!open || !prefill || !date) { setEventChoices([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setEventsLoading(true);
      const hasTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
      const T = new Date(`${date}T${hasTime ? time : '12:00'}:00`).getTime();
      const from = hasTime ? T - 5 * 3600e3 : T - 14 * 3600e3;
      const to = hasTime ? T + 1.5 * 3600e3 : T + 12 * 3600e3;
      const { data } = await db.from('te_calendar_events')
        .select('id, title, starts_at, ends_at, attendees, location_raw')
        .eq('user_id', userId)
        .gte('ends_at', new Date(from).toISOString())
        .lte('starts_at', new Date(to).toISOString())
        .order('starts_at')
        .limit(8);
      if (cancelled) return;
      const sorted = ((data ?? []) as EventChoice[])
        .sort((a, b) =>
          Math.abs(new Date(a.starts_at).getTime() - T) - Math.abs(new Date(b.starts_at).getTime() - T))
        .slice(0, 4);
      setEventChoices(sorted);
      setEventsLoading(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [open, prefill, date, time, userId]);

  // Présélection : le match existant s'il est dans la liste, sinon le RDV le
  // plus proche — tant que l'utilisateur n'a pas choisi lui-même.
  useEffect(() => {
    if (eventChosenByUser) return;
    if (eventChoices.length === 0) { setSelectedEventId(null); return; }
    if (existingMatchEventId && eventChoices.some((e) => e.id === existingMatchEventId)) {
      setSelectedEventId(existingMatchEventId);
    } else {
      setSelectedEventId(eventChoices[0].id);
    }
  }, [eventChoices, existingMatchEventId, eventChosenByUser]);

  // À l'entrée sur l'écran 2 : RDV rattaché (pour les suggestions) + carnet.
  // Chargé à ce moment-là (pas à l'ouverture) : le matching post-OCR tourne en
  // arrière-plan et a ainsi quelques secondes de plus pour aboutir.
  useEffect(() => {
    if (!open || step !== 2 || !prefill) return;
    let cancelled = false;
    (async () => {
      // Le RDV choisi à l'écran 1 prime ; à défaut, le match existant.
      const chosen = selectedEventId && selectedEventId !== 'none'
        ? eventChoices.find((e) => e.id === selectedEventId) ?? null
        : null;
      const [{ data: m }, { data: cs }] = await Promise.all([
        chosen
          ? Promise.resolve({ data: null })
          : db.from('te_expense_matches')
            .select('status, te_calendar_events(title, attendees)')
            .eq('expense_id', prefill.expenseId)
            .maybeSingle(),
        db.from('te_contacts')
          .select('id, email, first_name, last_name, display_name, company_name, company_domain')
          .eq('user_id', userId)
          .limit(1000),
      ]);
      if (cancelled) return;
      const ev = chosen ?? (m as any)?.te_calendar_events;
      setEventCtx(ev ? { title: ev.title, attendees: Array.isArray(ev.attendees) ? ev.attendees : [] } : null);
      setContactPool(cs ?? []);
    })();
    return () => { cancelled = true; };
  }, [open, step, prefill, userId, selectedEventId, eventChoices]);

  // Suggestions de participants : invités du RDV rattaché + prénoms du titre
  // (« Déj Régis et Lolo » → fuzzy match sur le carnet te_contacts).
  const suggestions = useMemo((): GuestSuggestion[] => {
    if (!eventCtx) return [];
    const out: GuestSuggestion[] = [];
    const seen = new Set<string>();
    const taken = new Set(guests.flatMap((g) => [
      g.contactId ?? '', g.email ? norm(g.email) : '', norm(g.displayName),
    ].filter(Boolean)));
    const push = (s: GuestSuggestion) => {
      const key = s.contact?.id ?? (s.email ? norm(s.email) : norm(s.name));
      if (!key || seen.has(key)) return;
      if (taken.has(key) || (s.contact && taken.has(s.contact.id)) || taken.has(norm(s.name))) return;
      seen.add(key);
      out.push(s);
    };

    // 1. Invités du RDV (emails Google) — signal le plus fort.
    for (const a of eventCtx.attendees as any[]) {
      if (!a || a.self) continue;
      const email: string | null = a.email ?? null;
      const c = email ? contactPool.find((x) => norm(x.email) === norm(email)) ?? null : null;
      const name = c ? contactName(c) : (a.displayName || (email ? email.split('@')[0] : ''));
      if (!name) continue;
      push({ contact: c, name, email, company: c ? contactCompany(c) : '' });
    }

    // 2. Prénoms/surnoms dans le TITRE du RDV, en fuzzy sur le carnet.
    const tokens = norm(eventCtx.title ?? '')
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 3 && !TITLE_STOPWORDS.has(t));
    for (const t of tokens) {
      for (const c of contactPool) {
        const hay = [c.first_name, c.last_name, c.display_name, c.email.split('@')[0]]
          .filter(Boolean).map((v) => norm(v as string));
        if (hay.some((h) => h.includes(t))) {
          push({ contact: c, name: contactName(c), email: c.email, company: contactCompany(c) });
        }
      }
    }
    return out.slice(0, 6);
  }, [eventCtx, contactPool, guests]);

  // Lookup contacts — te_contacts (RDV synchronisés) ET carnet Gmail en
  // parallèle, debounce 300 ms, dédup par email.
  useEffect(() => {
    if (!open || step !== 2) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); setGoogleResults([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      setSearching(true);
      const like = `%${q}%`;
      const [{ data }, googleRes] = await Promise.all([
        db.from('te_contacts')
          .select('id, email, first_name, last_name, display_name, company_name, company_domain')
          .eq('user_id', userId)
          .or(`display_name.ilike.${like},email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},company_name.ilike.${like}`)
          .limit(8),
        supabase.functions.invoke('enrich-contacts', { body: { search: q } })
          .catch(() => ({ data: null, error: true })),
      ]);
      if (cancelled) return;
      const local: ContactRow[] = (data ?? []).filter((c: ContactRow) => !guests.some((g) => g.contactId === c.id));
      setResults(local);
      const localEmails = new Set(local.map((c) => norm(c.email)));
      const g = (googleRes as any)?.data;
      setBlocked(g?.blocked ?? null);
      setGoogleResults(((g?.results ?? []) as { name: string; email: string | null; company: string | null }[])
        .filter((r) => !(r.email && localEmails.has(norm(r.email))))
        .filter((r) => !guests.some((x) => (r.email && x.email && norm(x.email) === norm(r.email)) || norm(x.displayName) === norm(r.name)))
        .slice(0, 5));
      setSearching(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query, open, step, userId, guests]);

  // ---- Sanity checks TVA (bottom-up et top-down) ----
  const checks = useMemo(() => {
    const parsed = lines
      .map((l) => ({ rate: num(l.rate), ht: num(l.ht), tva: num(l.tva) }))
      .filter((l) => !Number.isNaN(l.rate) || !Number.isNaN(l.ht) || !Number.isNaN(l.tva));
    const sumHT = parsed.reduce((s, l) => s + (Number.isNaN(l.ht) ? 0 : l.ht), 0);
    const sumTVA = parsed.reduce((s, l) => s + (Number.isNaN(l.tva) ? 0 : l.tva), 0);
    const tol = Math.max(0.02, parsed.length * 0.01);

    const items: { ok: boolean; label: string }[] = [];
    // Top-down : les trois totaux entre eux.
    if (has(totalHT) && has(totalTVA) && has(totalTTC)) {
      const ok = close(num(totalHT) + num(totalTVA), num(totalTTC), tol);
      items.push({
        ok,
        label: ok
          ? `HT + TVA = TTC (${euro(num(totalTTC))})`
          : `HT + TVA = ${euro(num(totalHT) + num(totalTVA))} ≠ TTC ${euro(num(totalTTC))} (écart ${euro(num(totalHT) + num(totalTVA) - num(totalTTC))})`,
      });
    }
    // Bottom-up : somme des lignes vs totaux déclarés.
    if (parsed.length > 0) {
      if (has(totalHT)) {
        const ok = close(sumHT, num(totalHT), tol);
        items.push({
          ok,
          label: ok
            ? `Σ HT des taux = total HT (${euro(sumHT)})`
            : `Σ HT des taux ${euro(sumHT)} ≠ total HT ${euro(num(totalHT))}`,
        });
      }
      if (has(totalTVA)) {
        const ok = close(sumTVA, num(totalTVA), tol);
        items.push({
          ok,
          label: ok
            ? `Σ TVA des taux = total TVA (${euro(sumTVA)})`
            : `Σ TVA des taux ${euro(sumTVA)} ≠ total TVA ${euro(num(totalTVA))}`,
        });
      }
      if (has(totalTTC)) {
        const ok = close(sumHT + sumTVA, num(totalTTC), tol);
        items.push({
          ok,
          label: ok
            ? `Σ (HT + TVA) des taux = TTC (${euro(sumHT + sumTVA)})`
            : `Σ (HT + TVA) des taux ${euro(sumHT + sumTVA)} ≠ TTC ${euro(num(totalTTC))}`,
        });
      }
    }
    // Cohérence par ligne : HT × taux ≈ TVA.
    const lineWarnings = lines.map((l) => {
      if (!has(l.rate) || !has(l.ht) || !has(l.tva)) return false;
      return !close(num(l.ht) * num(l.rate) / 100, num(l.tva), 0.02);
    });
    return { items, lineWarnings, sumHT, sumTVA };
  }, [lines, totalHT, totalTVA, totalTTC]);

  const allOk = checks.items.length > 0 && checks.items.every((c) => c.ok)
    && !checks.lineWarnings.some(Boolean);

  const recalcFromLines = () => {
    setTotalHT(fmt(checks.sumHT));
    setTotalTVA(fmt(checks.sumTVA));
    setTotalTTC(fmt(checks.sumHT + checks.sumTVA));
  };

  const setLine = (i: number, patch: Partial<VatLineDraft>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const applySirene = (patch: Partial<SireneFields>) => {
    if (patch.merchant !== undefined) setMerchant(patch.merchant);
    if (patch.siret !== undefined) setSiret(patch.siret);
    if (patch.address !== undefined) setAddress(patch.address);
    if (patch.naf !== undefined) setNaf(patch.naf);
    if (patch.nafLabel !== undefined) setNafLabel(patch.nafLabel);
  };

  const addGuest = (s: GuestSuggestion) => {
    setGuests((g) => [...g, {
      contactId: s.contact?.id ?? null,
      displayName: s.name,
      email: s.email,
      companyName: s.company,
      originalCompany: s.contact?.company_name ?? null,
    }]);
    setQuery('');
    setResults([]);
  };

  const addFreeGuest = () => {
    const name = query.trim();
    if (!name) return;
    addGuest({ contact: null, name: toProperCase(name), email: null, company: '' });
  };

  // Contact du carnet Gmail : on l'inscrit dans te_contacts (source manual) pour
  // que les prochains lookups le trouvent en local, puis on l'ajoute au frais.
  const addGuestFromGoogle = async (r: { name: string; email: string | null; company: string | null }) => {
    let contact: ContactRow | null = null;
    if (r.email) {
      const { data } = await db.from('te_contacts')
        .upsert({
          user_id: userId,
          email: r.email.toLowerCase(),
          display_name: r.name,
          company_name: r.company,
          source: 'manual',
          enrich_source: 'google_contacts',
          enriched_at: new Date().toISOString(),
        }, { onConflict: 'user_id,email' })
        .select('id, email, first_name, last_name, display_name, company_name, company_domain')
        .single();
      contact = data ?? null;
    }
    addGuest({ contact, name: r.name, email: r.email, company: r.company ?? (contact ? contactCompany(contact) : '') });
  };

  const save = async () => {
    if (!prefill || !has(totalTTC)) return;
    setSaving(true);
    try {
      const occurredAt = date ? new Date(`${date}T${time || '12:00'}:00`) : null;
      const cleanSiret = siret.replace(/\D/g, '');
      // Normalisation « Proper Case » de tous les champs texte (règle fleuron).
      const properMerchant = merchant.trim() ? toProperCase(merchant) : '';
      const properAddress = address.trim() ? toProperCase(address) : '';
      const parsedLines = lines
        .filter((l) => has(l.rate) && (has(l.ht) || has(l.tva)))
        .map((l) => ({
          rate: num(l.rate),
          ht: has(l.ht) ? num(l.ht) : null,
          tva: has(l.tva) ? num(l.tva) : null,
        }));

      // Rattachement au RDV choisi à l'écran 1 : confirmation DIRECTE (l'utilisateur
      // a vu la liste et tranché) ; « aucun » → no_context ; pas de choix possible
      // (pas de candidats) → on laisse le moteur retenter en arrière-plan.
      const linkedEvent = selectedEventId && selectedEventId !== 'none' ? selectedEventId : null;
      const expenseStatus = linkedEvent ? 'confirmed'
        : selectedEventId === 'none' ? 'no_context'
        : undefined;

      const { error } = await db.from('te_expenses').update({
        merchant_raw: merchant.trim() || null,
        merchant_clean: properMerchant || null,
        supplier_siret: cleanSiret || null,
        supplier_address: properAddress || null,
        supplier_naf: naf.trim() || null,
        supplier_naf_label: nafLabel.trim() || null,
        amount: num(totalTTC),
        amount_ht: has(totalHT) ? num(totalHT) : null,
        vat_amount: has(totalTVA) ? num(totalTVA) : null,
        vat_breakdown: parsedLines.length ? parsedLines : null,
        ...(occurredAt ? { occurred_at: occurredAt.toISOString() } : {}),
        ...(expenseStatus ? { status: expenseStatus } : {}),
        te_category: category || null,
        verified_at: new Date().toISOString(),
      }).eq('id', prefill.expenseId);
      if (error) throw error;

      if (linkedEvent) {
        const { error: mErr } = await db.from('te_expense_matches').upsert({
          expense_id: prefill.expenseId,
          calendar_event_id: linkedEvent,
          confidence: 100,
          signals: { manual: 1 },
          status: 'confirmed',
          decided_by: userId,
          decided_at: new Date().toISOString(),
          user_id: userId,
        }, { onConflict: 'expense_id' });
        if (mErr) throw mErr;
      } else if (selectedEventId === 'none' && existingMatchEventId) {
        await db.from('te_expense_matches')
          .update({ status: 'rejected', decided_by: userId, decided_at: new Date().toISOString() })
          .eq('expense_id', prefill.expenseId);
      }

      // Invités : remplacement idempotent (la modale peut être rouverte).
      const { error: delErr } = await db.from('te_expense_guests')
        .delete().eq('expense_id', prefill.expenseId);
      if (delErr) throw delErr;
      if (guests.length) {
        const { error: insErr } = await db.from('te_expense_guests').insert(
          guests.map((g) => ({
            user_id: userId,
            expense_id: prefill.expenseId,
            contact_id: g.contactId,
            display_name: toProperCase(g.displayName),
            email: g.email ? g.email.trim().toLowerCase() : null,
            company_name: g.companyName.trim() ? toProperCase(g.companyName) : null,
          })),
        );
        if (insErr) throw insErr;
      }

      // L'entreprise corrigée sur un contact connu remonte dans le carnet.
      await Promise.all(
        guests
          .filter((g) => g.contactId && g.companyName.trim() && g.companyName.trim() !== (g.originalCompany ?? ''))
          .map((g) =>
            db.from('te_contacts')
              .update({ company_name: toProperCase(g.companyName) })
              .eq('id', g.contactId)),
      );

      // Pas de choix explicite possible (aucun candidat affiché) : le moteur
      // retente en arrière-plan — sinon le choix de l'écran 1 fait foi.
      if (!linkedEvent && selectedEventId !== 'none') {
        supabase.functions.invoke('match-expense', { body: { expense_id: prefill.expenseId } })
          .catch(() => { /* matching best-effort */ });
      }

      toast({
        title: 'Frais vérifié',
        description: guests.length
          ? `${merchant || 'Frais'} — ${euro(num(totalTTC))} · ${guests.length} participant${guests.length > 1 ? 's' : ''}`
          : `${merchant || 'Frais'} — ${euro(num(totalTTC))}`,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur à l’enregistrement', description: e.message ?? String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const screen1 = (
    <>
      <DialogHeader>
        <DialogTitle>Vérifier le justificatif</DialogTitle>
        <DialogDescription>
          Relisez ce que l'OCR a extrait — tout est corrigeable avant enregistrement.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rv-merchant">Fournisseur</Label>
            <Input id="rv-merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rv-siret">SIRET / SIREN</Label>
            <Input id="rv-siret" placeholder="14 chiffres" value={siret}
              onChange={(e) => setSiret(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="rv-address">Adresse</Label>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setSireneOpen(true)}>
              <Landmark className="h-3 w-3 mr-1" /> Compléter via SIRENE
            </Button>
          </div>
          <Input id="rv-address" placeholder="12 rue …, 75009 Paris" value={address}
            onChange={(e) => setAddress(e.target.value)} />
        </div>
        {(naf || nafLabel) && (
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rv-naf">Code NAF</Label>
              <Input id="rv-naf" value={naf} onChange={(e) => setNaf(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rv-naf-label">Activité</Label>
              <Input id="rv-naf-label" value={nafLabel} onChange={(e) => setNafLabel(e.target.value)} />
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rv-date">Date</Label>
            <Input id="rv-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rv-time">Heure</Label>
            <Input id="rv-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type de frais</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* RDV correspondant — lookup agenda depuis la date/heure du ticket */}
        {date && (
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-sm font-medium flex items-center gap-1.5">
              <CalendarCheck2 className="h-4 w-4 text-muted-foreground" /> RDV correspondant
              {eventsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            {eventChoices.length === 0 ? (
              !eventsLoading && (
                <div className="text-xs text-muted-foreground">
                  Aucun RDV dans l'agenda autour de ce créneau — vérifiez la date/heure ou synchronisez l'agenda.
                </div>
              )
            ) : (
              <div className="space-y-1.5">
                {eventChoices.map((ev) => {
                  const n = Array.isArray(ev.attendees) ? ev.attendees.length : 0;
                  const sel = selectedEventId === ev.id;
                  return (
                    <label
                      key={ev.id}
                      className={`flex items-center gap-2.5 rounded-md border p-2 cursor-pointer text-sm ${sel ? 'border-brand bg-brand/5' : 'hover:bg-muted/40'}`}
                    >
                      <input
                        type="radio"
                        name="rv-event"
                        className="accent-brand shrink-0"
                        checked={sel}
                        onChange={() => { setSelectedEventId(ev.id); setEventChosenByUser(true); }}
                      />
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{ev.title ?? '(sans titre)'}</span>
                        <span className="text-muted-foreground">
                          {' '}· {format(new Date(ev.starts_at), 'EEE d MMM · HH:mm', { locale: fr })}
                        </span>
                      </span>
                      {n > 0 && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {n}
                        </span>
                      )}
                    </label>
                  );
                })}
                <label
                  className={`flex items-center gap-2.5 rounded-md border p-2 cursor-pointer text-sm text-muted-foreground ${selectedEventId === 'none' ? 'border-brand bg-brand/5' : 'hover:bg-muted/40'}`}
                >
                  <input
                    type="radio"
                    name="rv-event"
                    className="shrink-0"
                    checked={selectedEventId === 'none'}
                    onChange={() => { setSelectedEventId('none'); setEventChosenByUser(true); }}
                  />
                  Aucun de ces RDV
                </label>
              </div>
            )}
          </div>
        )}

        {/* Ventilation TVA par taux */}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">TVA par taux</div>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs"
              onClick={() => setLines((ls) => [...ls, { rate: '', ht: '', tva: '' }])}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un taux
            </Button>
          </div>
          <div className="grid grid-cols-[1fr_1.4fr_1.4fr_28px] gap-2 text-[11px] text-muted-foreground px-0.5">
            <span>Taux %</span><span>Base HT €</span><span>TVA €</span><span />
          </div>
          {lines.map((l, i) => (
            <div key={i}>
              <div className="grid grid-cols-[1fr_1.4fr_1.4fr_28px] gap-2 items-center">
                <Input inputMode="decimal" placeholder="10" value={l.rate}
                  onChange={(e) => setLine(i, { rate: e.target.value })} className="h-8" />
                <Input inputMode="decimal" placeholder="0,00" value={l.ht}
                  onChange={(e) => setLine(i, { ht: e.target.value })} className="h-8" />
                <Input inputMode="decimal" placeholder="0,00" value={l.tva}
                  onChange={(e) => setLine(i, { tva: e.target.value })} className="h-8" />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              {checks.lineWarnings[i] && (
                <div className="text-[11px] text-amber-600 mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {`${fmt(num(l.ht))} € × ${l.rate} % = ${fmt(num(l.ht) * num(l.rate) / 100)} €, pas ${fmt(num(l.tva))} €`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rv-ht">Total HT (€)</Label>
            <Input id="rv-ht" inputMode="decimal" value={totalHT}
              onChange={(e) => setTotalHT(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rv-tva">Total TVA (€)</Label>
            <Input id="rv-tva" inputMode="decimal" value={totalTVA}
              onChange={(e) => setTotalTVA(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rv-ttc">Total TTC (€)</Label>
            <Input id="rv-ttc" inputMode="decimal" value={totalTTC}
              onChange={(e) => setTotalTTC(e.target.value)} />
          </div>
        </div>

        {/* Sanity checks */}
        {checks.items.length > 0 && (
          <div className={`rounded-lg border p-3 space-y-1.5 ${allOk ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
            {checks.items.map((c, i) => (
              <div key={i} className={`text-xs flex items-center gap-1.5 ${c.ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                {c.label}
              </div>
            ))}
            {!allOk && (
              <Button type="button" variant="outline" size="sm" className="h-7 mt-1 text-xs"
                onClick={recalcFromLines}>
                <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Recalculer les totaux depuis les taux
              </Button>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => setStep(2)} disabled={!has(totalTTC)}>
          Qui participe ? <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </DialogFooter>
    </>
  );

  const screen2 = (
    <>
      <DialogHeader>
        <DialogTitle>Qui participe ?</DialogTitle>
        <DialogDescription>
          Les invités justifient le frais (obligation fiscale pour les repas d'affaires).
          L'entreprise remonte du carnet de contacts — corrigez-la si besoin.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-3">
        {/* Suggestions depuis le RDV rattaché : invités + prénoms du titre */}
        {suggestions.length > 0 && (
          <div className="rounded-lg border border-brand/30 bg-brand/5 p-2.5 space-y-1.5">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
              Suggérés depuis le RDV{eventCtx?.title ? ` « ${eventCtx.title} »` : ''}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <Button key={`${s.contact?.id ?? s.name}-${i}`} type="button" variant="outline" size="sm"
                  className="h-7 text-xs" onClick={() => addGuest(s)}>
                  <Plus className="h-3 w-3 mr-1" />
                  {s.name}{s.company && ` (${s.company})`}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Chercher un contact (nom, email, entreprise)…"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length === 0 && query.trim()) {
                e.preventDefault();
                addFreeGuest();
              }
            }}
          />
          {(results.length > 0 || googleResults.length > 0 || (query.trim().length >= 2 && !searching)) && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 min-w-0"
                  onClick={() => addGuest({ contact: c, name: contactName(c), email: c.email, company: contactCompany(c) })}
                >
                  <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{contactName(c)}</span>
                  <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                  {contactCompany(c) && (
                    <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                      {contactCompany(c)}
                    </Badge>
                  )}
                </button>
              ))}
              {googleResults.map((r, i) => (
                <button
                  key={`g-${r.email ?? r.name}-${i}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 min-w-0"
                  onClick={() => addGuestFromGoogle(r)}
                >
                  <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  {r.email && <span className="text-xs text-muted-foreground truncate">{r.email}</span>}
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    {r.company && <Badge variant="outline" className="text-[10px]">{r.company}</Badge>}
                    <Badge variant="secondary" className="text-[10px]">Gmail</Badge>
                  </span>
                </button>
              ))}
              {searching && (
                <div className="px-3 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5 border-t">
                  <Loader2 className="h-3 w-3 animate-spin" /> Recherche dans le carnet Gmail…
                </div>
              )}
              {blocked && (
                <div className="px-3 py-1.5 text-[11px] text-amber-700 bg-amber-50 border-t">
                  {blocked === 'api_disabled'
                    ? "Carnet Gmail indisponible : l'API Google People n'est pas activée sur le projet Google Cloud « sapajoo » (à activer une fois dans la console GCP)."
                    : blocked === 'no_connection'
                      ? 'Agenda Google non connecté — connectez-le depuis la page Notes de frais.'
                      : "Carnet Gmail inaccessible : accès aux contacts non accordé. Fermez cette fenêtre et cliquez « Reconnecter » dans le bloc Agenda Google."}
                </div>
              )}
              {query.trim() && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 text-sm border-t"
                  onClick={addFreeGuest}
                >
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  Ajouter « {query.trim()} »
                </button>
              )}
            </div>
          )}
        </div>

        {guests.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 rounded-lg border border-dashed">
            Aucun participant pour l'instant — cherchez un contact ou tapez un nom.
          </div>
        ) : (
          <div className="space-y-2">
            {guests.map((g, i) => (
              <div key={`${g.contactId ?? 'free'}-${i}`} className="rounded-lg border p-2.5 flex items-center gap-2.5">
                <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{g.displayName}</div>
                  {g.email && <div className="text-[11px] text-muted-foreground truncate">{g.email}</div>}
                </div>
                <div className="relative w-[180px] shrink-0">
                  <Building2 className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Entreprise"
                    className="h-8 pl-7 text-sm"
                    value={g.companyName}
                    onChange={(e) =>
                      setGuests((gs) => gs.map((x, j) => (j === i ? { ...x, companyName: e.target.value } : x)))}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                  onClick={() => setGuests((gs) => gs.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
          Enregistrer{guests.length > 0 && ` (${guests.length} participant${guests.length > 1 ? 's' : ''})`}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
        <DialogContent className={`${docUrl ? 'sm:max-w-[1080px]' : 'sm:max-w-[560px]'} max-h-[92vh] overflow-y-auto`}>
          <div className={docUrl ? 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-5 md:items-start' : ''}>
            {/* Visionneuse du justificatif : toujours visible pour contrôler
                taux et montants en regardant le document. */}
            {docUrl && (
              <div className="rounded-lg border bg-muted/40 overflow-hidden flex flex-col mb-4 md:mb-0 md:sticky md:top-0 h-[320px] md:h-[calc(92vh-7rem)]">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-background/60">
                  <span className="text-xs font-medium text-muted-foreground">Justificatif</span>
                  {!docIsPdf && (
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 4) / 4))}>
                        <ZoomOut className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)} %</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.25) * 4) / 4))}>
                        <ZoomIn className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {docIsPdf ? (
                  // Visionneuse PDF du navigateur : zoom/rotation intégrés.
                  <iframe src={docUrl} title="Justificatif" className="flex-1 w-full" />
                ) : (
                  <div className="flex-1 overflow-auto">
                    <img
                      src={docUrl}
                      alt="Justificatif"
                      className="cursor-zoom-in select-none"
                      style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
                      onDoubleClick={() => setZoom((z) => (z >= 3 ? 1 : z + 1))}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0">
              {step === 1 ? screen1 : screen2}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SireneFraisDialog
        open={sireneOpen}
        onOpenChange={setSireneOpen}
        defaultQuery={siret.replace(/\D/g, '') || merchant}
        current={{ merchant, siret, address, naf, nafLabel }}
        onApply={applySirene}
      />
    </>
  );
};

export default ReceiptVerifyModal;
