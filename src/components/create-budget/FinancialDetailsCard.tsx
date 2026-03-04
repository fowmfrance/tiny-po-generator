import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { FormValues } from './types';

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
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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

            {(resalePrice > 0 || initialAmount > 0) && (
              <div className={`p-4 rounded-md border ${
                margin && margin >= 0
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {margin && margin >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    Marge prévisionnelle
                  </span>
                  <div className="text-right">
                    <span className={`font-bold ${margin && margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: form.watch('currency') || 'EUR',
                      }).format(margin || 0)}
                    </span>
                    {marginPercentage !== null && (
                      <span className={`ml-2 text-sm ${marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ({marginPercentage.toFixed(1)}%)
                      </span>
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
