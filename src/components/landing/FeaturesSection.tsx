
import React from 'react';

const features = [
  {
    title: "Traitement Automatisé",
    description: "Automatisez le traitement des bons de commande pour gagner du temps et réduire les erreurs.",
    icon: "⚙️"
  },
  {
    title: "Suivi en Temps Réel",
    description: "Accédez à l'état de vos commandes en temps réel, où que vous soyez.",
    icon: "🔄"
  },
  {
    title: "Gestion des Budgets",
    description: "Contrôlez facilement vos dépenses avec une gestion intuitive des budgets.",
    icon: "💰"
  },
  {
    title: "Intégration Simple",
    description: "S'intègre facilement avec vos outils actuels pour une transition sans effort.",
    icon: "🔌"
  },
  {
    title: "Analyses Détaillées",
    description: "Obtenez des insights précieux grâce à des rapports et analyses complets.",
    icon: "📊"
  },
  {
    title: "Interface Intuitive",
    description: "Une interface utilisateur conçue pour être simple et efficace.",
    icon: "🖥️"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Fonctionnalités principales
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Découvrez comment Sapajoo peut révolutionner votre workflow et vous faire gagner du temps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-2">
              <div className="text-3xl">{feature.icon}</div>
              <div>
                <h3 className="font-semibold text-xl mb-2 text-primary">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
