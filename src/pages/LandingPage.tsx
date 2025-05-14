
import React from 'react';
import SignupForm from '@/components/SignupForm';
import { Check } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 md:px-8 lg:px-16 bg-white">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center">
              <div className="bg-primary p-2 rounded-lg">
                <img 
                  src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
                  alt="Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
              <h2 className="ml-3 font-bold text-2xl tracking-tight">Sapajoo</h2>
            </div>
            <button className="text-primary font-medium hover:text-primary/80 transition-colors">
              Connexion
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 max-w-2xl">
              <div className="inline-block bg-accent text-primary font-medium rounded-full px-6 py-2 text-sm mb-8">
                Ouverture Juin 2025
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-primary leading-tight">
                Simplifiez la gestion de vos budgets achats
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-10 leading-relaxed">
                Sapajoo simplifie et sécurise votre processus de suivi de budgets achats avec une plateforme intuitive et complète. 
                Rejoignez notre liste d'attente pour être parmi les premiers à y accéder.
              </p>
            </div>
            
            <div className="flex-1 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-marie">
                <img 
                  src="/placeholder.svg" 
                  alt="Aperçu Sapajoo" 
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
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
            {[
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
            ].map((feature, index) => (
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
      
      {/* How It Works Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-accent">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Comment ça marche?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Un processus simple en trois étapes pour transformer votre gestion administrative
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
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
            ].map((step, index) => (
              <div key={index} className="flex flex-col items-center p-6 bg-white rounded-lg shadow-marie">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="font-semibold text-xl mb-3 text-primary text-center">{step.title}</h3>
                <p className="text-gray-600 text-center" dangerouslySetInnerHTML={{ __html: step.description }}></p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Signup Form Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-white">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-marie p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
                Rejoignez notre liste d'attente
              </h2>
              <p className="text-gray-600">
                Soyez parmi les premiers à découvrir comment Sapajoo peut révolutionner votre processus d'achat
              </p>
            </div>
            
            <SignupForm />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-16 px-4 md:px-8 lg:px-16 bg-white border-t border-gray-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-primary p-2 rounded-lg">
                  <img 
                    src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
                    alt="Logo" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <span className="ml-3 font-bold text-xl text-primary">Sapajoo</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Simplifiez votre processus d'achat et de gestion des bons de commande avec notre plateforme innovante.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-primary mb-4">Liens</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Accueil</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-primary mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-600">contact@sapajoo.com</li>
                <li className="text-gray-600">+33 1 23 45 67 89</li>
                <li className="text-gray-600">Paris, France</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0 text-gray-500">
              &copy; {new Date().getFullYear()} Sapajoo. Tous droits réservés.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
