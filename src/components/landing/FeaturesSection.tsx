
import React from 'react';
import { UserRound } from 'lucide-react';

const features = [
  {
    title: "Gestion des Founrisseurs",
    description: "Bénéficiez d'un portail fournisseur clé en main, permettant l'enregistrement sécurisé, la transmission de factures, et le partage des informations de règlement",
    icon: <UserRound className="text-primary h-8 w-8" />
  },
 {
    title: "Pilotage des Budgets",
    description: "Contrôlez facilement vos dépenses avec une gestion intuitive des budgets.",
    icon: "💰"
  },
  
  {
    title: "Suivi en Temps Réel",
    description: "Accédez à l'état de vos budgets : montants engagés, factures reçues, factures restant à payer...Et traduction comptable en terme de reconnaissance des charges",
    icon: "🔄"
  },
 
  {
    title: "Implémentation en quelques clicks",
    description: "Personnalisez votre nomenclature, importez et exportez facilement vers d'autres outils, ou créez des connexion avec nos API",
    icon: "🔌"
  },
  {
    title: "Analyses Détaillées",
    description: "Obtenez des insights précieux grâce à des rapports et analyses complets",
    icon: "📊"
  },
  {
    title: "Interface Intuitive",
    description: "Une interface utilisateur conçue pour être simple et efficace",
    icon: "🖥️"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-4 md:px-8 lg:px-16 bg-white/30 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Fonctionnalités principales
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Découvrez comment Sapajoo peut révolutionner votre workflow et vous faire gagner du temps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-lg shadow-marie">
              <div className="text-4xl mb-4">
                {typeof feature.icon === 'string' ? feature.icon : feature.icon}
              </div>
              <h3 className="font-semibold text-xl mb-3 text-primary text-center">{feature.title}</h3>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
