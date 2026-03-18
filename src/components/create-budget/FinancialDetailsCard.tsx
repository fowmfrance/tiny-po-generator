import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, ToggleLeft } from 'lucide-react';
import { FormValues } from './types';
import { Button } from '@/components/ui/button';

type MarginMode = 'resale_price' | 'margin_percent';

interface FinancialDetailsCardProps {
  form: UseFormReturn<FormValues>;
  isProjectType: boolean;
  margin: number | null;
  marginPercentage: number | null;
  resalePrice: number;
  initialAmount: number;
}

export function FinancialDetailsCard({
  form,
  isProjectType,
  margin,
  marginPercentage,
  resalePrice,
  initialAmount,
}: FinancialDetailsCardProps) {
  const [marginMode, setMarginMode] = useState<MarginMode>('resale_price');
  const [markupPercent, setMarkupPercent] = useState<number>(0);

  const computedResalePrice = marginMode === 'margin_percent' && initialAmount > 0
    ? initialAmount / (1 - markupPercent / 100)
    : resalePrice;

  const computedMargin = marginMode === 'margin_percent'
    ? computedResalePrice - initialAmount
    : margin;

  const computedMarginPct = marginMode === 'margin_percent'
    ? markupPercent
    : marginPercentage;

  const handleMarkupChange = (pct: number) => {
    setMarkupPercent(pct);
    if (initialAmount > 0 && pct < 100) {
      const newResale = Math.round(initialAmount / (1 - pct / 100) * 100) / 100;
      form.setValue('resalePrice', newResale);
    }
  };

  const currency = form.watch('currency') || 'EUR';
  const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails financiers</CardTitle>
        <CardDescription>
          Définissez les paramètres financiers de ce budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Devise</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="EUR" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="min-w-[80px]">
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="initialAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isProjectType ? 'Budget des coûts' : 'Montant initial'}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    field.onChange(val);
                    if (marginMode === 'margin_percent' && markupPercent > 0 && markupPercent < 100) {
                      const newResale = Math.round(val / (1 - markupPercent / 100) * 100) / 100;
                      form.setValue('resalePrice', newResale);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </FormControl>
              <FormDescription>
                {isProjectType ? 'Somme des coûts prévisionnels du projet' : 'Le montant de départ de ce budget'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isProjectType && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mode de calcul :</span>
              <Button
                type="button"
                variant={marginMode === 'resale_price' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMarginMode('resale_price')}
              >
                Prix de vente
              </Button>
              <Button
                type="button"
                variant={marginMode === 'margin_percent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMarginMode('margin_percent')}
              >
                % de marge
              </Button>
            </div>

            {marginMode === 'resale_price' ? (
              <FormField
                control={form.control}
                name="resalePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de revente extérieur</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                      />
                    </FormControl>
                    <FormDescription>Montant facturé au client final</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormItem>
                <FormLabel>Taux de marge (%)</FormLabel>
                <Input
                  type="number"
                  placeholder="ex: 25"
                  min={0}
                  max={99}
                  value={markupPercent || ''}
                  onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                />
                <FormDescription>
                  La marge souhaitée en % du prix de vente
                </FormDescription>
              </FormItem>
            )}

            {(computedResalePrice > 0 || initialAmount > 0) && (
              <div className={`p-4 rounded-md border ${
                computedMargin && computedMargin >= 0
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {computedMargin && computedMargin >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {marginMode === 'margin_percent' ? 'CA prévisionnel' : 'Marge prévisionnelle'}
                  </span>
                  <div className="text-right">
                    {marginMode === 'margin_percent' ? (
                      <>
                        <span className="font-bold text-foreground">
                          {fmt.format(computedResalePrice)}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          (marge : {fmt.format(computedMargin || 0)})
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`font-bold ${computedMargin && computedMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt.format(computedMargin || 0)}
                        </span>
                        {computedMarginPct !== null && (
                          <span className={`ml-2 text-sm ${computedMarginPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({computedMarginPct.toFixed(1)}%)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de début</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type="date" className="pl-10" {...field} />
                  </FormControl>
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date de fin</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type="date" className="pl-10" {...field} />
                  </FormControl>
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
