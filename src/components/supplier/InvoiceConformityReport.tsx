import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Brain, Building2, CreditCard, Hash, Calendar, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ExtractedInvoiceData {
  emitter_name?: string;
  emitter_siren?: string;
  emitter_address?: string;
  emitter_iban?: string;
  emitter_bic?: string;
  emitter_bank_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  po_number?: string;
  amount_ht?: number;
  vat_rate?: number;
  vat_amount?: number;
  amount_ttc?: number;
  currency?: string;
  payment_terms?: string;
  confidence?: Record<string, string>;
}

export interface ConformityCheck {
  field: string;
  status: 'ok' | 'warning' | 'error';
  expected: string;
  found: string;
  message: string;
}

export interface ConformityResult {
  extracted: ExtractedInvoiceData;
  conformity: { checks: ConformityCheck[] } | null;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'ok':
      return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    default:
      return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
  }
};

const ConfidenceBadge = ({ level }: { level?: string }) => {
  if (!level || level === 'not_found') return null;
  const colors: Record<string, string> = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[level] || ''}`}>
      {level === 'high' ? 'Sûr' : level === 'medium' ? 'Probable' : 'Incertain'}
    </span>
  );
};

export function InvoiceConformityReport({ result }: { result: ConformityResult }) {
  const { extracted, conformity } = result;
  const checks = conformity?.checks || [];
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30 rounded-t-lg">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Rapport de conformité AI</span>
        <div className="ml-auto flex gap-1.5">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-5">
              {errorCount} erreur{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 border-amber-400 text-amber-600">
              {warningCount} alerte{warningCount > 1 ? 's' : ''}
            </Badge>
          )}
          {errorCount === 0 && warningCount === 0 && checks.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 border-green-400 text-green-600">
              Conforme
            </Badge>
          )}
        </div>
      </div>

      {/* Extracted data summary */}
      <div className="p-3 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {extracted.emitter_name && (
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Émetteur :</span>
              <span className="font-medium truncate">{extracted.emitter_name}</span>
              <ConfidenceBadge level={extracted.confidence?.emitter_name} />
            </div>
          )}
          {extracted.emitter_siren && (
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">SIREN :</span>
              <span className="font-medium">{extracted.emitter_siren}</span>
            </div>
          )}
          {extracted.emitter_iban && (
            <div className="flex items-center gap-1.5 col-span-2">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">IBAN :</span>
              <span className="font-medium font-mono text-xs">{extracted.emitter_iban}</span>
              <ConfidenceBadge level={extracted.confidence?.iban} />
            </div>
          )}
          {extracted.amount_ht != null && (
            <div className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">HT :</span>
              <span className="font-medium">{extracted.amount_ht?.toFixed(2)} €</span>
              <ConfidenceBadge level={extracted.confidence?.amount_ht} />
            </div>
          )}
          {extracted.amount_ttc != null && (
            <div className="flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">TTC :</span>
              <span className="font-medium">{extracted.amount_ttc?.toFixed(2)} €</span>
            </div>
          )}
          {extracted.vat_rate != null && extracted.vat_amount != null && (
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="text-muted-foreground ml-5">TVA {extracted.vat_rate}% :</span>
              <span className="font-medium">{extracted.vat_amount?.toFixed(2)} €</span>
            </div>
          )}
          {extracted.po_number && (
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">BdC ref :</span>
              <span className="font-medium">{extracted.po_number}</span>
              <ConfidenceBadge level={extracted.confidence?.po_number} />
            </div>
          )}
          {extracted.payment_terms && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Conditions :</span>
              <span className="font-medium truncate">{extracted.payment_terms}</span>
            </div>
          )}
        </div>
      </div>

      {/* Conformity checks */}
      {checks.length > 0 && (
        <div className="border-t">
          <div className="p-2 space-y-1">
            {checks.map((check, idx) => (
              <div key={idx} className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 text-sm">
                <StatusIcon status={check.status} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs">{check.message}</p>
                  {check.status !== 'ok' && check.expected && check.found && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Attendu : <span className="font-medium">{check.expected}</span>
                      {check.found && <> — Trouvé : <span className="font-medium">{check.found}</span></>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
