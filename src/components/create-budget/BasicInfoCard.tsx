import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock } from 'lucide-react';
import { FormValues, BUDGET_TYPES } from './types';

interface BasicInfoCardProps {
  form: UseFormReturn<FormValues>;
  generatedCode: string;
}

export function BasicInfoCard({ form, generatedCode }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations de base</CardTitle>
        <CardDescription>
          Saisissez les informations de base pour ce budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="budgetTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de budget</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type de budget" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BUDGET_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Détermine le format de numérotation du code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel className="flex items-center gap-2">
            Code du budget
            <Lock className="h-3 w-3 text-muted-foreground" />
          </FormLabel>
          <Input
            value={generatedCode}
            readOnly
            disabled
            placeholder="Sélectionnez un type de budget"
            className="bg-muted cursor-not-allowed"
          />
          <FormDescription>
            Auto-généré selon le type de budget sélectionné
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du budget</FormLabel>
              <FormControl>
                <Input placeholder="ex: Budget Projet Alpha" {...field} />
              </FormControl>
              <FormDescription>
                Un nom descriptif pour ce budget
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
