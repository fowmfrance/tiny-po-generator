import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Download, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const recognitionModes = [
  { value: 'linear', label: 'Linéaire' },
  { value: 'progress', label: 'Avancement' },
  { value: 'completion', label: 'Achèvement' }
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
    
    // Calculate time ratios
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.min(totalDays, Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    const elapsedRatio = totalDays > 0 ? elapsedDays / totalDays : 0;

    // Calculate recognized amounts based on recognition mode
    const calculateRecognizedAmount = (amount: number, mode: string) => {
      switch (mode) {
        case 'linear':
          return amount * elapsedRatio;
        case 'progress':
          // Simplified progress calculation - could be enhanced with actual progress input
          return amount * elapsedRatio * 1.1; // Slightly ahead of linear
        case 'completion':
          return today >= endDate ? amount : 0; // All or nothing
        default:
          return amount * elapsedRatio;
      }
    };

    const recognizedRevenue = calculateRecognizedAmount(revenue, data.revenueRecognition);
    const recognizedCosts = calculateRecognizedAmount(costs, data.costRecognition);

    // Calculate cut-off adjustments
    const deferredRevenue = Math.max(0, issuedInvoices - recognizedRevenue); // Produits constatés d'avance
    const invoicesToIssue = Math.max(0, recognizedRevenue - issuedInvoices); // Factures à émettre
    const invoicesNotReceived = Math.max(0, recognizedCosts - receivedInvoices); // Factures non parvenues
    const deferredCharges = Math.max(0, receivedInvoices - recognizedCosts); // Charges constatées d'avance

    return [
      {
        label: 'Produits Constatés d\'Avance',
        amount: deferredRevenue,
        description: 'Chiffre d\'affaires facturé mais non encore reconnu'
      },
      {
        label: 'Factures à Émettre',
        amount: invoicesToIssue,
        description: 'Chiffre d\'affaires reconnu mais non encore facturé'
      },
      {
        label: 'Factures Non Parvenues',
        amount: invoicesNotReceived,
        description: 'Charges reconnues mais factures non reçues'
      },
      {
        label: 'Charges Constatées d\'Avance',
        amount: deferredCharges,
        description: 'Factures reçues mais charges non encore reconnues'
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Simulateur de Cut-off</h1>
          <p className="text-muted-foreground">
            Calculez vos ajustements de fin d'exercice comptable
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de Simulation</CardTitle>
            <CardDescription>
              Saisissez les données financières et les modes de reconnaissance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="revenue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chiffre d'Affaires (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coûts (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="receivedInvoices"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Factures Reçues à Date (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
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
                        <FormLabel>Factures Émises à Date (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de Début</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Sélectionner une date</span>
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
                        <FormLabel>Date de Fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Sélectionner une date</span>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="revenueRecognition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode de Reconnaissance - CA</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recognitionModes.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
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
                        <FormLabel>Mode de Reconnaissance - Coûts</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recognitionModes.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculer le Cut-off
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {showResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Résultats de la Simulation
                <Button onClick={generateCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </CardTitle>
              <CardDescription>
                Ajustements recommandés pour la clôture comptable
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type d'Ajustement</TableHead>
                    <TableHead className="text-right">Montant (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{result.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {result.amount.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CutOffSimulator;