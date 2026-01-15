import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, Calculator, TrendingUp, TrendingDown, FileText, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import DateInputSplit from '@/components/cut-off/DateInputSplit';

const cutOffSchema = z.object({
  realiseFinDeMois: z.number().min(0, 'Le montant doit être positif'),
  factureADate: z.number().min(0, 'Le montant doit être positif'),
  startDay: z.number().min(1).max(31),
  startMonth: z.number().min(1).max(12),
  startYear: z.number().min(1900).max(2100),
  endDay: z.number().min(1).max(31),
  endMonth: z.number().min(1).max(12),
  endYear: z.number().min(1900).max(2100),
}).refine((data) => {
  const startDate = new Date(data.startYear, data.startMonth - 1, data.startDay);
  const endDate = new Date(data.endYear, data.endMonth - 1, data.endDay);
  return isValid(startDate) && isValid(endDate) && endDate > startDate;
}, {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['endDay']
});

type CutOffFormData = z.infer<typeof cutOffSchema>;

interface CutOffResults {
  dateJour: {
    date: Date;
    ratio: number;
    caReconnu: number;
    pca: number;
    fae: number;
    controle: number;
  };
  finPeriode: {
    date: Date;
    ratio: number;
    caReconnu: number;
    pca: number;
    fae: number;
    controle: number;
  };
  factureADate: number;
}

const CutOffSimulator = () => {
  const [results, setResults] = useState<CutOffResults | null>(null);
  const [showResults, setShowResults] = useState(false);

  const today = useMemo(() => new Date(), []);

  const form = useForm<CutOffFormData>({
    resolver: zodResolver(cutOffSchema),
    defaultValues: {
      realiseFinDeMois: 0,
      factureADate: 0,
      startDay: 1,
      startMonth: today.getMonth() + 1,
      startYear: today.getFullYear(),
      endDay: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
      endMonth: today.getMonth() + 1,
      endYear: today.getFullYear(),
    }
  });

  const calculateCutOff = (data: CutOffFormData): CutOffResults => {
    const startDate = new Date(data.startYear, data.startMonth - 1, data.startDay);
    const endDate = new Date(data.endYear, data.endMonth - 1, data.endDay);
    const currentDate = new Date();

    const totalDays = differenceInDays(endDate, startDate) + 1;
    const elapsedDays = Math.min(totalDays, Math.max(0, differenceInDays(currentDate, startDate) + 1));

    // Ratio à la date du jour
    const ratioDateJour = totalDays > 0 ? elapsedDays / totalDays : 0;
    // Ratio à fin de période = 100%
    const ratioFinPeriode = 1;

    // CA reconnu (prorata temporis)
    const caDateJour = ratioDateJour * data.realiseFinDeMois;
    const caFinPeriode = ratioFinPeriode * data.realiseFinDeMois;

    // PCA (Produits Constatés d'Avance) - on a facturé plus que le CA reconnu
    const pcaDateJour = Math.max(0, data.factureADate - caDateJour);
    const pcaFinPeriode = Math.max(0, data.factureADate - caFinPeriode);

    // FAE (Factures à Établir) - on a facturé moins que le CA reconnu
    const faeDateJour = Math.max(0, caDateJour - data.factureADate);
    const faeFinPeriode = Math.max(0, caFinPeriode - data.factureADate);

    // Contrôle de cohérence: CA - (Facturé + FAE - PCA) = 0
    const controleJour = caDateJour - (data.factureADate + faeDateJour - pcaDateJour);
    const controleFinPeriode = caFinPeriode - (data.factureADate + faeFinPeriode - pcaFinPeriode);

    return {
      dateJour: {
        date: currentDate,
        ratio: ratioDateJour,
        caReconnu: caDateJour,
        pca: pcaDateJour,
        fae: faeDateJour,
        controle: controleJour,
      },
      finPeriode: {
        date: endDate,
        ratio: ratioFinPeriode,
        caReconnu: caFinPeriode,
        pca: pcaFinPeriode,
        fae: faeFinPeriode,
        controle: controleFinPeriode,
      },
      factureADate: data.factureADate,
    };
  };

  const onSubmit = (data: CutOffFormData) => {
    const cutOffResults = calculateCutOff(data);
    setResults(cutOffResults);
    setShowResults(true);
  };

  const generateCSV = () => {
    if (!results) return;

    const headers = ['Élément', 'À la date du jour', 'À la fin de période'];
    const rows = [
      ['Date', format(results.dateJour.date, 'dd/MM/yyyy'), format(results.finPeriode.date, 'dd/MM/yyyy')],
      ['Ratio temporel', `${(results.dateJour.ratio * 100).toFixed(1)}%`, `${(results.finPeriode.ratio * 100).toFixed(1)}%`],
      ['CA reconnu', results.dateJour.caReconnu.toFixed(2), results.finPeriode.caReconnu.toFixed(2)],
      ['Facturé à date', results.factureADate.toFixed(2), results.factureADate.toFixed(2)],
      ['PCA', results.dateJour.pca.toFixed(2), results.finPeriode.pca.toFixed(2)],
      ['FAE', results.dateJour.fae.toFixed(2), results.finPeriode.fae.toFixed(2)],
      ['Contrôle', results.dateJour.controle.toFixed(2), results.finPeriode.controle.toFixed(2)],
    ];

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cut-off-simulation-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isCoherent = (controle: number) => Math.abs(controle) < 0.01;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border/40 bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Simulateur de Cut-off
                  </h1>
                  <Badge variant="secondary" className="text-xs font-medium">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Beta
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Calculez vos ajustements de fin d'exercice comptable
                </p>
              </div>
            </div>
            {showResults && (
              <Button onClick={generateCSV} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exporter CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Form Section */}
          <div className="xl:col-span-2">
            <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                <h2 className="text-sm font-semibold text-foreground">Paramètres</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Saisissez vos données financières</p>
              </div>
              
              <div className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Montants Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Chiffre d'affaires
                      </div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="realiseFinDeMois"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Réalisé fin de mois</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pr-8 h-10 bg-background border-border/60 focus:border-primary/50"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="factureADate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Facturé à date</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pr-8 h-10 bg-background border-border/60 focus:border-primary/50"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    onFocus={(e) => e.target.select()}
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Période Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Période d'exercice
                      </div>
                      <div className="space-y-4">
                        <div>
                          <FormLabel className="text-xs text-muted-foreground font-normal">Date de début</FormLabel>
                          <div className="mt-1.5">
                            <DateInputSplit
                              day={form.watch('startDay')}
                              month={form.watch('startMonth')}
                              year={form.watch('startYear')}
                              onDayChange={(val) => form.setValue('startDay', val ?? 1)}
                              onMonthChange={(val) => form.setValue('startMonth', val ?? 1)}
                              onYearChange={(val) => form.setValue('startYear', val ?? 2024)}
                            />
                          </div>
                        </div>
                        <div>
                          <FormLabel className="text-xs text-muted-foreground font-normal">Date de fin</FormLabel>
                          <div className="mt-1.5">
                            <DateInputSplit
                              day={form.watch('endDay')}
                              month={form.watch('endMonth')}
                              year={form.watch('endYear')}
                              onDayChange={(val) => form.setValue('endDay', val ?? 1)}
                              onMonthChange={(val) => form.setValue('endMonth', val ?? 1)}
                              onYearChange={(val) => form.setValue('endYear', val ?? 2024)}
                            />
                          </div>
                          {form.formState.errors.endDay && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.endDay.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-11 gap-2 font-medium">
                      Calculer le Cut-off
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-3">
            {!showResults ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 h-full min-h-[400px] flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Calculator className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Aucun calcul effectué
                </h3>
                <p className="text-sm text-muted-foreground/70 max-w-sm">
                  Remplissez les paramètres à gauche et cliquez sur "Calculer le Cut-off" pour voir les résultats
                </p>
              </div>
            ) : results && (
              <div className="space-y-6">
                {/* Results Table */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                    <h2 className="text-sm font-semibold text-foreground">Résultats comparatifs</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Calcul prorata temporis (linéaire)</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/20">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                            Élément
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                            À la date du jour
                            <div className="text-[10px] font-normal normal-case mt-0.5">
                              ({format(results.dateJour.date, 'dd/MM/yyyy', { locale: fr })})
                            </div>
                          </th>
                          <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-6 py-3">
                            À la fin de période
                            <div className="text-[10px] font-normal normal-case mt-0.5">
                              ({format(results.finPeriode.date, 'dd/MM/yyyy', { locale: fr })})
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        <tr className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <span className="text-sm font-medium text-foreground">Ratio temporel</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-foreground">
                              {(results.dateJour.ratio * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-foreground">
                              {(results.finPeriode.ratio * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-sm font-medium text-foreground">CA reconnu</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-3.5 mt-0.5">Ratio × Réalisé fin de mois</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(results.dateJour.caReconnu)} €
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(results.finPeriode.caReconnu)} €
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/10 transition-colors bg-muted/5">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              <span className="text-sm text-muted-foreground">Facturé à date</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(results.factureADate)} €
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(results.factureADate)} €
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-foreground">PCA</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6 mt-0.5">Produits Constatés d'Avance</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-sm font-semibold",
                              results.dateJour.pca > 0 ? "text-orange-600" : "text-muted-foreground"
                            )}>
                              {formatCurrency(results.dateJour.pca)} €
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-sm font-semibold",
                              results.finPeriode.pca > 0 ? "text-orange-600" : "text-muted-foreground"
                            )}>
                              {formatCurrency(results.finPeriode.pca)} €
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-medium text-foreground">FAE</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6 mt-0.5">Factures à Établir</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-sm font-semibold",
                              results.dateJour.fae > 0 ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                              {formatCurrency(results.dateJour.fae)} €
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-sm font-semibold",
                              results.finPeriode.fae > 0 ? "text-emerald-600" : "text-muted-foreground"
                            )}>
                              {formatCurrency(results.finPeriode.fae)} €
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Contrôle de cohérence (temporaire) */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-foreground">Contrôle de cohérence</h2>
                      <Badge variant="outline" className="text-[10px]">Temporaire</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Formule: CA reconnu - (Facturé + FAE - PCA) = 0
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className={cn(
                        "rounded-lg p-4 border",
                        isCoherent(results.dateJour.controle) 
                          ? "bg-emerald-50 border-emerald-200" 
                          : "bg-red-50 border-red-200"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {isCoherent(results.dateJour.controle) ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-xs font-medium text-muted-foreground">À la date du jour</span>
                        </div>
                        <p className={cn(
                          "text-lg font-bold",
                          isCoherent(results.dateJour.controle) ? "text-emerald-700" : "text-red-700"
                        )}>
                          {isCoherent(results.dateJour.controle) ? "✓ Cohérent" : `Écart: ${formatCurrency(results.dateJour.controle)} €`}
                        </p>
                      </div>
                      <div className={cn(
                        "rounded-lg p-4 border",
                        isCoherent(results.finPeriode.controle) 
                          ? "bg-emerald-50 border-emerald-200" 
                          : "bg-red-50 border-red-200"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {isCoherent(results.finPeriode.controle) ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="text-xs font-medium text-muted-foreground">À la fin de période</span>
                        </div>
                        <p className={cn(
                          "text-lg font-bold",
                          isCoherent(results.finPeriode.controle) ? "text-emerald-700" : "text-red-700"
                        )}>
                          {isCoherent(results.finPeriode.controle) ? "✓ Cohérent" : `Écart: ${formatCurrency(results.finPeriode.controle)} €`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Footer */}
                <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Ces calculs sont basés sur un prorata temporis linéaire. 
                    Consultez votre expert-comptable pour validation avant écritures définitives.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CutOffSimulator;
