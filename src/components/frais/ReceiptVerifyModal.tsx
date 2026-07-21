// Modale de vérification post-upload d'un justificatif (module Notes de frais).
// Écran 1 « Vérification » : données OCR éditables (date, fournisseur, SIRET,
//   adresse, ventilation TVA par taux, totaux) + sanity checks bottom-up
//   (somme des lignes vs totaux) et top-down (HT + TVA = TTC, cohérence par taux).
// Écran 2 « Qui participe » : lookup multi-select des invités (te_contacts),
//   l'entreprise du contact remonte et reste éditable — snapshot par frais.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Building2, Check, CheckCircle2,
  Loader2, Plus, Search, Trash2, UserRound, Wand2, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_META } from './categoryMeta';

const db = supabase as any;

export interface VatLineDraft { rate: string; ht: string; tva: string }

export interface VerifyPrefill {
  expenseId: string;
  receiptId: string | null;
  merchant: string;
  siret: string;
  address: string;
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

// Saisie FR tolérée (« 85,50 ») ; NaN si vide/invalide.
const num = (s: string): number => parseFloat(s.replace(/\s/g, '').replace(',', '.'));
const has = (s: string) => s.trim() !== '' && !Number.isNaN(num(s));
const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const euro = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
// Tolérance d'arrondi : 1 centime par ligne agrégée, minimum 2 centimes.
const close = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol + 1e-9;

const contactName = (c: ContactRow) =>
  c.display_name
  || [c.first_name, c.last_name].filter(Boolean).join(' ')
  || c.email;

const contactCompany = (c: ContactRow) => c.company_name ?? c.company_domain ?? '';

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

  // --- Écran 1 : données du justificatif ---
  const [merchant, setMerchant] = useState('');
  const [siret, setSiret] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [totalTTC, setTotalTTC] = useState('');
  const [totalHT, setTotalHT] = useState('');
  const [totalTVA, setTotalTVA] = useState('');
  const [lines, setLines] = useState<VatLineDraft[]>([]);

  // --- Écran 2 : participants ---
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContactRow[]>([]);
  const [searching, setSearching] = useState(false);

  // (Re)charge le prefill + les invités déjà enregistrés à l'ouverture.
  useEffect(() => {
    if (!open || !prefill) return;
    setStep(1);
    setMerchant(prefill.merchant);
    setSiret(prefill.siret);
    setAddress(prefill.address);
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

  // Lookup contacts (carnet agenda enrichi) — debounce 250 ms.
  useEffect(() => {
    if (!open || step !== 2) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const like = `%${q}%`;
      const { data } = await db.from('te_contacts')
        .select('id, email, first_name, last_name, display_name, company_name, company_domain')
        .eq('user_id', userId)
        .or(`display_name.ilike.${like},email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},company_name.ilike.${like}`)
        .limit(8);
      setResults((data ?? []).filter((c: ContactRow) => !guests.some((g) => g.contactId === c.id)));
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
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

  const addGuestFromContact = (c: ContactRow) => {
    setGuests((g) => [...g, {
      contactId: c.id,
      displayName: contactName(c),
      email: c.email,
      companyName: contactCompany(c),
      originalCompany: c.company_name,
    }]);
    setQuery('');
    setResults([]);
  };

  const addFreeGuest = () => {
    const name = query.trim();
    if (!name) return;
    setGuests((g) => [...g, {
      contactId: null, displayName: name, email: null, companyName: '', originalCompany: null,
    }]);
    setQuery('');
    setResults([]);
  };

  const save = async () => {
    if (!prefill || !has(totalTTC)) return;
    setSaving(true);
    try {
      const occurredAt = date ? new Date(`${date}T${time || '12:00'}:00`) : null;
      const cleanSiret = siret.replace(/\D/g, '');
      const parsedLines = lines
        .filter((l) => has(l.rate) && (has(l.ht) || has(l.tva)))
        .map((l) => ({
          rate: num(l.rate),
          ht: has(l.ht) ? num(l.ht) : null,
          tva: has(l.tva) ? num(l.tva) : null,
        }));

      const { error } = await db.from('te_expenses').update({
        merchant_raw: merchant || null,
        merchant_clean: merchant || null,
        supplier_siret: cleanSiret || null,
        supplier_address: address.trim() || null,
        amount: num(totalTTC),
        amount_ht: has(totalHT) ? num(totalHT) : null,
        vat_amount: has(totalTVA) ? num(totalTVA) : null,
        vat_breakdown: parsedLines.length ? parsedLines : null,
        ...(occurredAt ? { occurred_at: occurredAt.toISOString() } : {}),
        te_category: category || null,
        verified_at: new Date().toISOString(),
      }).eq('id', prefill.expenseId);
      if (error) throw error;

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
            display_name: g.displayName,
            email: g.email,
            company_name: g.companyName.trim() || null,
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
              .update({ company_name: g.companyName.trim() })
              .eq('id', g.contactId)),
      );

      // La date/heure a pu changer → on relance le matching RDV.
      supabase.functions.invoke('match-expense', { body: { expense_id: prefill.expenseId } })
        .catch(() => { /* matching best-effort */ });

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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Vérifier le justificatif</DialogTitle>
              <DialogDescription>
                Relisez ce que l'OCR a extrait — tout est corrigeable avant enregistrement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
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
                <Label htmlFor="rv-address">Adresse</Label>
                <Input id="rv-address" placeholder="12 rue …, 75009 Paris" value={address}
                  onChange={(e) => setAddress(e.target.value)} />
              </div>
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
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Qui participe ?</DialogTitle>
              <DialogDescription>
                Les invités justifient le frais (obligation fiscale pour les repas d'affaires).
                L'entreprise remonte du carnet de contacts — corrigez-la si besoin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
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
                {(results.length > 0 || (query.trim().length >= 2 && !searching)) && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md overflow-hidden">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent flex items-center gap-2 min-w-0"
                        onClick={() => addGuestFromContact(c)}
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptVerifyModal;
