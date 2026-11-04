import React from 'react';
import { Target, ClipboardCheck, TrendingUp } from 'lucide-react';

const steps = [
  {
    title: "1. Définissez vos budgets",
    description: "Créez vos enveloppes de <span class='highlight-yellow'>budgets</span> par département, projet ou catégorie de dépenses.",
    icon: Target
  },
  {
    title: "2. Gérez vos achats",
    description: "Créez, approuvez et suivez vos <span class='highlight-green'>commandes</span>, puis affectez-les à vos enveloppes. Plus de risque de dépassement.",
    icon: ClipboardCheck
  },
  {
    title: "3. Pilotez votre activité",
    description: "Visualisez vos performances, suivez vos <span class='highlight-pink'>budgets et dépenses</span>, et générez en quelques clics vos écritures de cut-off (rattachement des charges à la bonne période).",
    icon: TrendingUp
  }
];

const HowItWorksSection = () => {
  return (
    <section id="avantages" className="py-20 md:py-24 bg-secondary">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl text-foreground mb-4">
            Comment ça marche
          </h2>
          <p className="text-muted-foreground text-lg">
            Un processus solide, sans la complexité des outils traditionnels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div key={index} className="border-t-[3px] border-brand pt-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <step.icon className="h-6 w-6 text-brand" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl mb-2 text-foreground">{step.title}</h3>
              <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: step.description }}></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
