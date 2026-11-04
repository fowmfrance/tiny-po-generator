import React from 'react';
import { cn } from '@/lib/utils';

const steps = [
  { title: 'Budget', description: 'Définition des budgets' },
  { title: 'Fournisseur', description: 'Enregistrement sécurisé' },
  { title: 'Facture', description: 'Transmise via le portail' },
  { title: 'Pré-comptabilité', description: 'Affectation budgétaire et reconnaissance des charges' },
  { title: 'Règlement', description: "Suivi jusqu'au paiement" },
];

const ProcessFlowSection = () => (
  <section className="bg-secondary border-y border-border py-12">
    <div className="mx-auto max-w-6xl px-4 md:px-8">
      <ol aria-label="Le parcours achats dans Sapajoo" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-y-8">
        {steps.map((step, index) => (
          <li key={step.title} className={cn('px-6 py-2', index > 0 && 'lg:border-l lg:border-border')}>
            <span className="text-brand text-sm font-semibold">{index + 1}</span>
            <h3 className="font-serif text-xl text-foreground mt-1 mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default ProcessFlowSection;
