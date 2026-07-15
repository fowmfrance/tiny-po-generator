import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toProperCase } from '@/utils/properCase';
import { Loader2, Sparkles, Undo2, ArrowRight, Type } from 'lucide-react';

const db = supabase as any; // RPCs pas encore dans les types générés

interface Change {
  id: string;
  from: string;
  to: string;
}

const BackofficeNormalizeNames: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [changes, setChanges] = useState<Change[]>([]);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [restoring, setRestoring] = useState(false);

  const scan = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.rpc('admin_list_suppliers');
      if (error) throw error;
      const rows = (data || []) as { id: string; name: string }[];
      setTotal(rows.length);
      setChanges(
        rows
          .map((r) => ({ id: r.id, from: r.name, to: toProperCase(r.name || '') }))
          .filter((c) => c.to && c.to !== c.from),
      );
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { scan(); }, []);

  const apply = async () => {
    setApplying(true);
    setProgress(0);
    let done = 0;
    try {
      for (const c of changes) {
        const { error } = await db.rpc('admin_rename_supplier', { _id: c.id, _name: c.to });
        if (error) throw error;
        done += 1;
        setProgress(done);
      }
      toast({ title: 'Noms normalisés', description: `${done} fournisseur(s) mis au format propre (backup effectué).` });
      await scan();
    } catch (e: any) {
      toast({ variant: 'destructive', title: `Interrompu après ${done}`, description: e?.message });
    } finally {
      setApplying(false);
    }
  };

  const restore = async () => {
    setRestoring(true);
    try {
      const { data, error } = await db.rpc('admin_restore_supplier_names');
      if (error) throw error;
      toast({ title: 'Restauration effectuée', description: `${Number(data) || 0} nom(s) restauré(s) depuis le backup.` });
      await scan();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: e?.message });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif flex items-center gap-2">
          <Type className="h-6 w-6 text-brand" />
          Normaliser les noms de fournisseurs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Applique le « format propre » aux noms existants (acronymes comme SNCF préservés). Backup automatique
          avant modification — restaurable en un clic.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              {loading ? 'Analyse…' : `${changes.length} nom(s) à normaliser`}
            </CardTitle>
            <CardDescription>
              {loading ? '' : `${total} fournisseurs analysés · ${total - changes.length} déjà au bon format`}
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={restore} disabled={restoring || applying}>
              {restoring ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Undo2 className="h-4 w-4 mr-2" />}
              Restaurer
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" disabled={loading || applying || changes.length === 0}>
                  {applying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {applying ? `Application ${progress}/${changes.length}` : 'Appliquer'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Normaliser {changes.length} nom(s) ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Les noms d'origine sont sauvegardés avant modification. Tu pourras tout restaurer via « Restaurer ».
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={apply}>Appliquer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : changes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Tous les noms sont déjà au format propre. 🎉</p>
          ) : (
            <ul className="divide-y divide-border max-h-[55vh] overflow-y-auto">
              {changes.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex-1 min-w-0 truncate text-muted-foreground line-through">{c.from}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  <span className="flex-1 min-w-0 truncate font-medium">{c.to}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackofficeNormalizeNames;
