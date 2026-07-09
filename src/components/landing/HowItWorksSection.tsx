import React from 'react';
import { Target, ClipboardCheck, TrendingUp } from 'lucide-react';

const steps = [
  {
    title: "1. Définissez vos budgets",
    description: "Créez vos enveloppes de <span class='highlight-yellow'>budgets</span> par département, projet ou catégorie de dépenses",
    icon: Target
  },
  {
    title: "2. Gérez vos achats",
    description: "Créez, approuvez et suivez vos <span class='highlight-green'>commandes</span> et affectez-les aux enveloppes budgétaires définies. Plus de risque de dépassement!",
    icon: ClipboardCheck
  },
  {
    title: "3. Pilotez votre activité",
    description: "Visualisez vos performances, suivez vos <span class='highlight-pink'>budgets et dépenses</span>, et générez en quelques clicks vos écritures de situation comptable (cut off)",
    icon: TrendingUp
  }
];

const HowItWorksSection = () => {
  return (
    <section id="avantages" className="py-20 px-4 md:px-8 lg:px-16 bg-transparent w-screen overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Avantages
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Un process robuste sans la complexité des outils traditionnels!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-lg shadow-marie">
              <div className="w-14 h-14 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <step.icon className="h-7 w-7 text-brand" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-primary text-center">{step.title}</h3>
              <p className="text-gray-600 text-center" dangerouslySetInnerHTML={{ __html: step.description }}></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
