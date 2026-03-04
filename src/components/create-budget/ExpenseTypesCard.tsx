import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormValues, EXPENSE_TYPES } from './types';

interface ExpenseTypesCardProps {
  form: UseFormReturn<FormValues>;
}

export function ExpenseTypesCard({ form }: ExpenseTypesCardProps) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Types de dépenses autorisées</CardTitle>
        <CardDescription>
          Sélectionnez les types de dépenses acceptés pour ce budget
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="expenseTypes"
          render={() => (
            <FormItem>
              <div className="grid gap-4">
                {EXPENSE_TYPES.map((type) => (
                  <FormField
                    key={type.id}
                    control={form.control}
                    name="expenseTypes"
                    render={({ field }) => (
                      <FormItem
                        key={type.id}
                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(type.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, type.id])
                                : field.onChange(field.value?.filter((v) => v !== type.id));
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-semibold cursor-pointer">
                            {type.label}
                          </FormLabel>
                          <FormDescription className="text-sm">
                            {type.description}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
