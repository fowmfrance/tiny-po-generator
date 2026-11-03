import React from 'react';
import { Users, Wallet, Activity, Plug, BarChart3, LayoutDashboard } from 'lucide-react';

const features = [
  {
    title: "Gestion des fournisseurs",
    description: "Un portail fournisseur clé en main\u00a0: vos fournisseurs s'enregistrent en toute sécurité, vous transmettent leurs factures et partagent leurs informations de règlement.",
    icon: Users
  },
  {
    title: "Pilotage des budgets",
    description: "Suivez vos dépenses par département, projet ou catégorie, avec des budgets simples à définir et à contrôler.",
    icon: Wallet
  },
  {
    title: "Suivi en temps réel",
    description: "Consultez l'état de vos budgets\u00a0: montants engagés, factures reçues, factures restant à payer. Sapajoo en assure aussi la traduction comptable (reconnaissance des charges).",
    icon: Activity
  },
  {
    title: "Prêt en quelques clics",
    description: "Personnalisez votre nomenclature, importez et exportez vos données vers vos autres outils, ou connectez-vous via notre API.",
    icon: Plug
  },
  {
    title: "Analyses détaillées",
    description: "Des rapports et des analyses pour comprendre où part votre budget et décider plus vite.",
    icon: BarChart3
  },
  {
    title: "Interface intuitive",
    description: "Une interface simple, pensée pour être prise en main sans formation.",
    icon: LayoutDashboard
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 md:px-8 lg:px-16 bg-white/30 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl text-primary mb-6">
            Fonctionnalités principales
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Gagnez du temps à chaque étape, du fournisseur à l'écriture comptable.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-lg shadow-marie">
              <div className="w-14 h-14 rounded-2xl bg-brand-subtle flex items-center justify-center mb-4">
                <feature.icon className="h-7 w-7 text-brand" strokeWidth={1.5} />
              </div>
              <h3 className=" text-xl mb-3 text-primary text-center">{feature.title}</h3>
              <p className="text-muted-foreground text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
