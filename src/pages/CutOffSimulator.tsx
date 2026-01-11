import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Download, Calculator, TrendingUp, TrendingDown, FileText, Receipt, ArrowRight, Sparkles, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const recognitionModes = [
  { value: 'linear', label: 'Linéaire', description: 'Prorata temporis' },
  { value: 'progress', label: 'Avancement', description: 'Selon avancement' },
  { value: 'completion', label: 'Achèvement', description: 'À la livraison' }
];

const cutOffSchema = z.object({
  revenue: z.number().min(0, 'Le chiffre d\'affaires doit être positif'),
  costs: z.number().min(0, 'Les coûts doivent être positifs'),
  receivedInvoices: z.number().min(0, 'Le montant doit être positif'),
  issuedInvoices: z.number().min(0, 'Le montant doit être positif'),
  startDate: z.date({ required_error: 'La date de début est requise' }),
  endDate: z.date({ required_error: 'La date de fin est requise' }),
  revenueRecognition: z.enum(['linear', 'progress', 'completion']),
  costRecognition: z.enum(['linear', 'progress', 'completion'])
}).refine((data) => data.endDate > data.startDate, {
  message: 'La date de fin doit être postérieure à la date de début',
  path: ['endDate']
});

type CutOffFormData = z.infer<typeof cutOffSchema>;

interface CutOffResult {
  label: string;
  amount: number;
  description: string;
  type: 'revenue' | 'cost';
  icon: React.ReactNode;
}

const CutOffSimulator = () => {
  const [results, setResults] = useState<CutOffResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<CutOffFormData>({
    resolver: zodResolver(cutOffSchema),
    defaultValues: {
      revenue: 0,
      costs: 0,
      receivedInvoices: 0,
      issuedInvoices: 0,
      revenueRecognition: 'linear',
      costRecognition: 'linear'
    }
  });

  const calculateCutOff = (data: CutOffFormData) => {
    const today = new Date();
    const { startDate, endDate, revenue, costs, receivedInvoices, issuedInvoices } = data;
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.min(totalDays, Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    const elapsedRatio = totalDays > 0 ? elapsedDays / totalDays : 0;

    const calculateRecognizedAmount = (amount: number, mode: string) => {
      switch (mode) {
        case 'linear':
          return amount * elapsedRatio;
        case 'progress':
          return amount * elapsedRatio * 1.1;
        case 'completion':
          return today >= endDate ? amount : 0;
        default:
          return amount * elapsedRatio;
      }
    };

    const recognizedRevenue = calculateRecognizedAmount(revenue, data.revenueRecognition);
    const recognizedCosts = calculateRecognizedAmount(costs, data.costRecognition);

    const deferredRevenue = Math.max(0, issuedInvoices - recognizedRevenue);
    const invoicesToIssue = Math.max(0, recognizedRevenue - issuedInvoices);
    const invoicesNotReceived = Math.max(0, recognizedCosts - receivedInvoices);
    const deferredCharges = Math.max(0, receivedInvoices - recognizedCosts);

    return [
      {
        label: 'Produits Constatés d\'Avance',
        amount: deferredRevenue,
        description: 'CA facturé mais non encore reconnu',
        type: 'revenue' as const,
        icon: <TrendingUp className="w-5 h-5" />
      },
      {
        label: 'Factures à Émettre',
        amount: invoicesToIssue,
        description: 'CA reconnu mais non encore facturé',
        type: 'revenue' as const,
        icon: <FileText className="w-5 h-5" />
      },
      {
        label: 'Factures Non Parvenues',
        amount: invoicesNotReceived,
        description: 'Charges reconnues mais non facturées',
        type: 'cost' as const,
        icon: <Receipt className="w-5 h-5" />
      },
      {
        label: 'Charges Constatées d\'Avance',
        amount: deferredCharges,
        description: 'Factures reçues mais charges non reconnues',
        type: 'cost' as const,
        icon: <TrendingDown className="w-5 h-5" />
      }
    ];
  };

  const onSubmit = (data: CutOffFormData) => {
    const cutOffResults = calculateCutOff(data);
    setResults(cutOffResults);
    setShowResults(true);
  };

  const generateCSV = () => {
    if (results.length === 0) return;

    const headers = ['Type', 'Montant (€)', 'Description'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        `"${result.label}"`,
        result.amount.toFixed(2),
        `"${result.description}"`
      ].join(','))
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

  const totalAdjustments = results.reduce((sum, r) => sum + r.amount, 0);

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
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="revenue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">CA Total</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pr-8 h-10 bg-background border-border/60 focus:border-primary/50"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          name="issuedInvoices"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Factures émises</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pr-8 h-10 bg-background border-border/60 focus:border-primary/50"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        Charges
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="costs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Coûts totaux</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pr-8 h-10 bg-background border-border/60 focus:border-primary/50"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          name="receivedInvoices"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Factures reçues</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pr-8 h-10 bg-background border-border/60 focus:border-primary/50"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs text-muted-foreground font-normal">Début</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "h-10 w-full pl-3 text-left font-normal bg-background border-border/60 hover:border-border",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd MMM yyyy", { locale: fr })
                                      ) : (
                                        <span className="text-muted-foreground">Sélectionner</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs text-muted-foreground font-normal">Fin</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "h-10 w-full pl-3 text-left font-normal bg-background border-border/60 hover:border-border",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd MMM yyyy", { locale: fr })
                                      ) : (
                                        <span className="text-muted-foreground">Sélectionner</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Recognition Mode Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        Mode de reconnaissance
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="revenueRecognition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Revenus</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-background border-border/60">
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {recognitionModes.map((mode) => (
                                    <SelectItem key={mode.value} value={mode.value}>
                                      <div className="flex flex-col">
                                        <span>{mode.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="costRecognition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground font-normal">Charges</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-10 bg-background border-border/60">
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {recognitionModes.map((mode) => (
                                    <SelectItem key={mode.value} value={mode.value}>
                                      <div className="flex flex-col">
                                        <span>{mode.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
            ) : (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total des ajustements</p>
                      <p className="text-3xl font-bold tracking-tight text-foreground mt-1">
                        {totalAdjustments.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                        {results.filter(r => r.type === 'revenue').length} produits
                      </Badge>
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                        {results.filter(r => r.type === 'cost').length} charges
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Répartition des ajustements</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={results.map(r => ({
                          name: r.label.length > 20 ? r.label.substring(0, 20) + '...' : r.label,
                          fullName: r.label,
                          amount: r.amount,
                          type: r.type
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis 
                          type="number" 
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={130}
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value: number) => [
                            `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
                            'Montant'
                          ]}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              return payload[0].payload.fullName;
                            }
                            return label;
                          }}
                        />
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                          {results.map((result, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={result.type === 'revenue' ? 'hsl(142, 71%, 45%)' : 'hsl(25, 95%, 53%)'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">Produits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-orange-500" />
                      <span className="text-xs text-muted-foreground">Charges</span>
                    </div>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={cn(
                        "group rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md hover:border-border",
                        result.type === 'revenue' 
                          ? "border-emerald-100 hover:border-emerald-200" 
                          : "border-orange-100 hover:border-orange-200"
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                          result.type === 'revenue'
                            ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                            : "bg-orange-50 text-orange-600 group-hover:bg-orange-100"
                        )}>
                          {result.icon}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-[10px] uppercase tracking-wider font-semibold",
                            result.type === 'revenue'
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                          )}
                        >
                          {result.type === 'revenue' ? 'Produit' : 'Charge'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">{result.label}</p>
                        <p className="text-xs text-muted-foreground mb-3">{result.description}</p>
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          {result.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-base font-normal text-muted-foreground ml-1">€</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info Footer */}
                <div className="rounded-lg bg-muted/30 border border-border/30 p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Ces calculs sont basés sur les données saisies et les modes de reconnaissance sélectionnés. 
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
