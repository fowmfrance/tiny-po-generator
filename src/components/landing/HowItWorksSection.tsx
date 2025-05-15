
import React from 'react';

const steps = [
  {
    title: "1. Configurez vos budgets",
    description: "Définissez facilement vos <span class='highlight-yellow'>budgets</span> par département, projet ou catégorie de dépenses.",
    icon: "🔧"
  },
  {
    title: "2. Gérez vos commandes",
    description: "Créez, approuvez et suivez vos <span class='highlight-green'>commandes</span> de manière centralisée.",
    icon: "📝"
  },
  {
    title: "3. Analysez vos dépenses",
    description: "Visualisez vos performances et optimisez vos processus grâce à des tableaux de bord intuitifs pour suivre vos <span class='highlight-pink'>dépenses</span>.",
    icon: "📈"
  }
];

const HowItWorksSection = () => {
  return (
    <section id="avantages" className="py-20 px-4 md:px-8 lg:px-16">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Avantages
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Un processus simple en trois étapes pour transformer votre gestion administrative
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white rounded-lg shadow-marie">
              <div className="text-4xl mb-4">{step.icon}</div>
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
