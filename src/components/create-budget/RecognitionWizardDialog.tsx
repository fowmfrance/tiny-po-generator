import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  CAC_OPTION,
  OVERVIEW_ROWS,
  Q1,
  Q2,
  WIZARD_RESULTS,
  WizardCard,
  WizardPath,
  WizardResult,
} from './recognitionWizardContent';
import { logWizardEvent } from './recognitionWizardAnalytics';

export interface WizardSelection {
  methodCode: string;
  path: WizardPath;
  /** R6 uniquement : étaler les coûts d'acquisition sur la durée du contrat */
  cacSpread: boolean;
}

interface RecognitionWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onValidate: (selection: WizardSelection) => void;
}

type Step = 'q1' | 'q2' | 'result' | 'overview';

function ChoiceCard({ card, onClick }: { card: WizardCard; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 rounded-lg border bg-card hover:border-primary hover:bg-accent/50 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{card.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{card.subtitle}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

export function RecognitionWizardDialog({
  open,
  onOpenChange,
  onValidate,
}: RecognitionWizardDialogProps) {
  const [step, setStep] = useState<Step>('q1');
  const [path, setPath] = useState<WizardPath | null>(null);
  const [cacSpread, setCacSpread] = useState(false);
  const [validated, setValidated] = useState(false);

  const result: WizardResult | null = path ? WIZARD_RESULTS[path] : null;

  const reset = () => {
    setStep('q1');
    setPath(null);
    setCacSpread(false);
    setValidated(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !validated) {
      logWizardEvent('wizard_abandoned', { step, path });
    }
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const goToResult = (p: WizardPath) => {
    setPath(p);
    setCacSpread(false);
    setStep('result');
    logWizardEvent('result_viewed', { path: p });
  };

  const handleQ1 = (key: string) => {
    logWizardEvent('q1_answered', { answer: key });
    if (key === 'B') {
      setStep('q2');
    } else {
      goToResult(key as WizardPath);
    }
  };

  const handleQ2 = (key: string) => {
    logWizardEvent('q2_answered', { answer: key });
    goToResult(key as WizardPath);
  };

  const handleBack = () => {
    if (step === 'q2' || step === 'overview') {
      setStep('q1');
      setPath(null);
    } else if (step === 'result' && path) {
      setStep(path.startsWith('B') ? 'q2' : 'q1');
      setPath(null);
    }
  };

  const handleValidate = () => {
    if (!result || !path) return;
    setValidated(true);
    logWizardEvent('wizard_validated', {
      path,
      method_code: result.methodCode,
      cac_spread: result.hasCacOption ? cacSpread : undefined,
    });
    onValidate({ methodCode: result.methodCode, path, cacSpread });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {step === 'q1' && (
          <>
            <DialogHeader>
              <DialogTitle>{Q1.title}</DialogTitle>
              <DialogDescription>{Q1.subtitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {Q1.cards.map(card => (
                <ChoiceCard key={card.key} card={card} onClick={() => handleQ1(card.key)} />
              ))}
            </div>
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground w-fit"
              onClick={() => {
                logWizardEvent('overview_opened', {});
                setStep('overview');
              }}
            >
              Je ne sais pas — voir toutes les situations
            </button>
          </>
        )}

        {step === 'q2' && (
          <>
            <DialogHeader>
              <DialogTitle>{Q2.title}</DialogTitle>
              <DialogDescription>{Q2.subtitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {Q2.cards.map(card => (
                <ChoiceCard key={card.key} card={card} onClick={() => handleQ2(card.key)} />
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Revenir
            </Button>
          </>
        )}

        {step === 'overview' && (
          <>
            <DialogHeader>
              <DialogTitle>Les 8 situations possibles</DialogTitle>
              <DialogDescription>
                Cliquez sur la situation qui ressemble le plus à ce budget.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[55vh] pr-3">
              <div className="space-y-2">
                {OVERVIEW_ROWS.map(row => (
                  <button
                    key={row.path}
                    type="button"
                    onClick={() => goToResult(row.path)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <p className="font-medium text-sm">{row.situation}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{row.example}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Revenir
            </Button>
          </>
        )}

        {step === 'result' && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {result.resultTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-1">Ce que Sapajoo fera</p>
                <p className="text-sm text-muted-foreground">{result.whatSapajooDoes}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-1">Et vos dépenses ?</p>
                <p className="text-sm text-muted-foreground">{result.expenses}</p>
              </div>

              {result.warning && (
                <div
                  className={
                    result.warningProminent
                      ? 'p-4 rounded-lg border border-destructive/40 bg-destructive/5'
                      : 'p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                  }
                >
                  <p className="text-sm text-muted-foreground flex gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{result.warning}</span>
                  </p>
                </div>
              )}

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="px-0 text-sm">
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Voir un exemple
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/30 border mt-1">
                    {result.example}
                  </p>
                </CollapsibleContent>
              </Collapsible>

              {result.hasCacOption && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="px-0 text-sm">
                      <ChevronDown className="h-4 w-4 mr-1" />
                      {CAC_OPTION.title}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 rounded-md border mt-1 space-y-3">
                      <p className="text-sm text-muted-foreground">{CAC_OPTION.body}</p>
                      <RadioGroup
                        value={cacSpread ? 'spread' : 'immediate'}
                        onValueChange={v => setCacSpread(v === 'spread')}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="immediate" id="cac-immediate" />
                          <Label htmlFor="cac-immediate" className="text-sm font-normal">
                            {CAC_OPTION.immediate}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="spread" id="cac-spread" />
                          <Label htmlFor="cac-spread" className="text-sm font-normal">
                            {CAC_OPTION.spread}
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <p className="text-xs text-muted-foreground/70">
                Nom technique : {result.technicalName}
              </p>

              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Revenir
                </Button>
                <Button type="button" onClick={handleValidate}>
                  Valider ce choix
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
