import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Flag, HelpCircle, Wand2 } from 'lucide-react';
import { Milestone } from '@/components/budget/MilestoneTimelineDialog';
import { FormValues } from './types';
import { RecognitionWizardDialog, WizardSelection } from './RecognitionWizardDialog';
import { METHOD_FRIENDLY_LABELS } from './recognitionWizardContent';
import { logWizardEvent } from './recognitionWizardAnalytics';

interface RecognitionMethod {
  id: string;
  name_expense: string;
  description: string;
  example: string | null;
  use_cases: string | null;
  code: string;
}

// Libellé picklist : « Libellé courant — Nom technique » pour rester cohérent
// avec le wizard (les deux voies mènent aux mêmes valeurs).
const methodLabel = (method: RecognitionMethod) => {
  const friendly = METHOD_FRIENDLY_LABELS[method.code];
  return friendly ? `${friendly.friendly} — ${friendly.technical}` : method.name_expense;
};

interface RecognitionMethodCardProps {
  form: UseFormReturn<FormValues>;
  recognitionMethods: RecognitionMethod[];
  selectedMethod: RecognitionMethod | undefined;
  isMilestoneMethod: boolean;
  milestones: Milestone[];
  onOpenMilestoneDialog: () => void;
  onWizardSelection?: (selection: WizardSelection) => void;
}

export function RecognitionMethodCard({
  form,
  recognitionMethods,
  selectedMethod,
  isMilestoneMethod,
  milestones,
  onOpenMilestoneDialog,
  onWizardSelection,
}: RecognitionMethodCardProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleWizardValidate = (selection: WizardSelection) => {
    const method = recognitionMethods.find(m => m.code === selection.methodCode);
    if (method) {
      // Pré-sélectionne dans la picklist : l'utilisateur peut encore modifier
      // manuellement avant d'enregistrer le budget.
      form.setValue('recognitionMethodId', method.id, { shouldValidate: true, shouldDirty: true });
    }
    onWizardSelection?.(selection);
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Reconnaissance des charges</CardTitle>
        <CardDescription>
          Définissez comment les charges seront reconnues à des fins comptables
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="recognitionMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Méthode de reconnaissance
                {selectedMethod && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium mb-1">{selectedMethod.name_expense}</p>
                        <p className="text-sm">{selectedMethod.description}</p>
                        {selectedMethod.example && (
                          <p className="text-sm mt-2 text-muted-foreground italic">
                            Ex: {selectedMethod.example}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionnez une méthode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {recognitionMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {methodLabel(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    logWizardEvent('wizard_opened', {});
                    setWizardOpen(true);
                  }}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Aidez-moi à choisir
                </Button>
              </div>
              <FormDescription>
                Détermine comment les charges sont réparties dans le temps
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedMethod && (
          <div className="bg-muted/50 p-4 rounded-md border">
            <h4 className="text-sm font-medium mb-2">{methodLabel(selectedMethod)}</h4>
            <p className="text-sm text-muted-foreground">{selectedMethod.description}</p>
            {selectedMethod.use_cases && (
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Cas d'usage :</strong> {selectedMethod.use_cases}
              </p>
            )}
          </div>
        )}

        {isMilestoneMethod && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" />
                  Jalons du projet (Milestones)
                </h4>
                <p className="text-sm text-muted-foreground">
                  Définissez les livrables attendus pour calculer l'avancement
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onOpenMilestoneDialog}
                className="flex items-center gap-2"
              >
                <Flag className="h-4 w-4" />
                {milestones.length > 0
                  ? `Modifier (${milestones.length} jalons)`
                  : 'Définir les jalons'}
              </Button>
            </div>

            {milestones.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jalons définis</span>
                  <span className="font-medium">{milestones.length} livrable(s)</span>
                </div>
                <div className="space-y-1">
                  {milestones.slice(0, 3).map((m, i) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-2 text-sm p-2 bg-background rounded border"
                    >
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">#{i + 1}</span>
                      <span className="truncate flex-1">{m.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {m.targetDate.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                  {milestones.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      + {milestones.length - 3} autre(s) jalon(s)
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                <Flag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun jalon défini</p>
                <p className="text-xs">Cliquez sur le bouton ci-dessus pour ajouter des livrables</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <RecognitionWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onValidate={handleWizardValidate}
      />
    </Card>
  );
}
