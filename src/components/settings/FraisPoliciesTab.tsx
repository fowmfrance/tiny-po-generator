// Paramètres → Notes de frais : politiques maison de l'instance.
// Matrice gérée par l'admin de l'org : chaque politique s'active par case à
// cocher, avec un seuil quand la règle en porte un. Les non-admins voient la
// matrice en lecture seule (la RLS bloque l'écriture de toute façon).
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { POLICY_KEYS, POLICY_META, PolicyKey } from '@/components/frais/policies';

const db = supabase as any;

interface Draft { enabled: boolean; threshold: string }

const FraisPoliciesTab: React.FC = () => {
  const { toast } = useToast();
  const { data: organizationId } = useOrganization();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<PolicyKey, Draft>>(() =>
    Object.fromEntries(POLICY_KEYS.map((k) => [k, {
      enabled: false,
      threshold: POLICY_META[k].defaultThreshold != null ? String(POLICY_META[k].defaultThreshold) : '',
    }])) as Record<PolicyKey, Draft>);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [{ data: adm }, { data: rows }] = await Promise.all([
        supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
        db.from('te_expense_policies').select('policy_key, enabled, threshold'),
      ]);
      setIsAdmin(!!adm);
      if (rows?.length) {
        setDrafts((prev) => {
          const next = { ...prev };
          for (const r of rows as { policy_key: PolicyKey; enabled: boolean; threshold: number | null }[]) {
            if (!POLICY_META[r.policy_key]) continue;
            next[r.policy_key] = {
              enabled: r.enabled,
              threshold: r.threshold != null ? String(r.threshold) : '',
            };
          }
          return next;
        });
      }
      setLoading(false);
    })();
  }, []);

  // Une politique à seuil activée sans seuil valide ne peut pas s'évaluer.
  const invalidKeys = useMemo(() => POLICY_KEYS.filter((k) => {
    const d = drafts[k];
    return d.enabled && POLICY_META[k].unit !== null
      && (d.threshold.trim() === '' || Number.isNaN(Number(d.threshold.replace(',', '.'))));
  }), [drafts]);

  const save = async () => {
    if (!organizationId || invalidKeys.length) return;
    setSaving(true);
    const payload = POLICY_KEYS.map((k) => ({
      organization_id: organizationId,
      policy_key: k,
      enabled: drafts[k].enabled,
      threshold: POLICY_META[k].unit !== null && drafts[k].threshold.trim() !== ''
        ? Number(drafts[k].threshold.replace(',', '.'))
        : null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await db.from('te_expense_policies')
      .upsert(payload, { onConflict: 'organization_id,policy_key' });
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur à l’enregistrement', description: error.message, variant: 'destructive' });
      return;
    }
    const active = POLICY_KEYS.filter((k) => drafts[k].enabled).length;
    toast({
      title: 'Politiques enregistrées',
      description: active
        ? `${active} règle${active > 1 ? 's' : ''} active${active > 1 ? 's' : ''} — les frais non conformes sont signalés, jamais bloqués.`
        : 'Aucune règle active.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Politiques de notes de frais</CardTitle>
        <CardDescription>
          Règles maison appliquées aux frais de toute l'organisation. Un frais hors
          règle est <span className="font-medium">signalé</span> (badge « Non conforme »
          et filtre dans le reporting) — jamais bloqué.
          {!isAdmin && !loading && (
            <span className="flex items-center gap-1.5 mt-1.5 text-amber-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              Lecture seule : seul un administrateur peut modifier ces règles.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Chargement…</div>
        ) : (
          <div className="space-y-1">
            {POLICY_KEYS.map((k) => {
              const meta = POLICY_META[k];
              const d = drafts[k];
              const Icon = meta.icon;
              const invalid = invalidKeys.includes(k);
              return (
                <div key={k}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${d.enabled ? '' : 'opacity-60'}`}>
                  <Checkbox
                    checked={d.enabled}
                    disabled={!isAdmin}
                    onCheckedChange={(v) =>
                      setDrafts((p) => ({ ...p, [k]: { ...p[k], enabled: v === true } }))}
                  />
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{meta.label}</div>
                    <div className="text-xs text-muted-foreground">{meta.hint}</div>
                  </div>
                  {meta.unit !== null && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        inputMode="decimal"
                        className={`h-8 w-24 text-right ${invalid ? 'border-destructive' : ''}`}
                        value={d.threshold}
                        disabled={!isAdmin || !d.enabled}
                        onChange={(e) =>
                          setDrafts((p) => ({ ...p, [k]: { ...p[k], threshold: e.target.value } }))}
                      />
                      <span className="text-xs text-muted-foreground w-12">{meta.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {isAdmin && (
              <div className="flex items-center justify-end gap-3 pt-3">
                {invalidKeys.length > 0 && (
                  <span className="text-xs text-destructive">
                    Renseignez le seuil des règles actives.
                  </span>
                )}
                <Button onClick={save} disabled={saving || !organizationId || invalidKeys.length > 0}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FraisPoliciesTab;
