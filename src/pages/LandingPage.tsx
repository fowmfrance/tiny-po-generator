
import React from 'react';
import WaitingListForm from '@/components/WaitingListForm';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-8 pb-20 px-4 md:px-8 lg:px-16">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-20">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
                alt="Logo" 
                className="h-16"
              />
              <h2 className="ml-2 font-bold text-xl">Sapajoo</h2>
            </div>
            <Button variant="outline" size="sm">
              Connexion
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                Simplifiez la gestion de vos bons de commande
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8">
                Sapajoo transforme votre gestion de bons de commande en un processus fluide et intuitif. Rejoignez notre liste d'attente pour être parmi les premiers à y accéder.
              </p>
              
              <WaitingListForm />
              
              <p className="text-sm text-gray-500 mt-4">
                Soyez les premiers à découvrir notre solution avant le lancement officiel.
              </p>
            </div>
            
            <div className="flex-1 relative">
              <div className="bg-white rounded-lg shadow-xl p-2 transform rotate-1">
                <img 
                  src="/placeholder.svg" 
                  alt="Aperçu Sapajoo" 
                  className="rounded w-full"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-white p-3 rounded-lg shadow-lg">
                <div className="text-sm font-medium">Lancement Prévu</div>
                <div className="text-xl font-bold">Juin 2025</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Fonctionnalités qui transforment votre gestion
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Traitement Automatisé",
                description: "Automatisez le traitement des bons de commande pour gagner du temps et réduire les erreurs."
              },
              {
                title: "Suivi en Temps Réel",
                description: "Accédez à l'état de vos commandes en temps réel, où que vous soyez."
              },
              {
                title: "Gestion des Budgets",
                description: "Contrôlez facilement vos dépenses avec une gestion intuitive des budgets."
              },
              {
                title: "Intégration Simple",
                description: "S'intègre facilement avec vos outils actuels pour une transition sans effort."
              },
              {
                title: "Analyses Détaillées",
                description: "Obtenez des insights précieux grâce à des rapports et analyses complets."
              },
              {
                title: "Interface Intuitive",
                description: "Une interface utilisateur conçue pour être simple et efficace."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à révolutionner votre gestion des commandes?
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Rejoignez notre liste d'attente dès maintenant et soyez parmi les premiers à découvrir Sapajoo.
          </p>
          
          <div className="max-w-md mx-auto">
            <WaitingListForm />
          </div>
          
          <div className="mt-16 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10">
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900">
              Demander une démo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="link" className="text-white">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 px-4 md:px-8 lg:px-16 bg-gray-800 text-gray-300">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img 
                src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
                alt="Logo" 
                className="h-10 filter brightness-0 invert"
              />
              <span className="ml-2 font-bold">Sapajoo</span>
            </div>
            
            <div className="text-sm">
              &copy; {new Date().getFullYear()} Sapajoo. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
