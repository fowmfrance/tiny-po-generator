
import React from 'react';
import WaitingListForm from '@/components/WaitingListForm';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-white pt-8 pb-24 px-4 md:px-8 lg:px-16 relative">
        <div className="container mx-auto relative z-10">
          <div className="flex justify-between items-center mb-20">
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
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              Connexion <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 max-w-2xl">
              <div className="inline-block bg-primary/10 text-primary font-medium rounded-full px-4 py-1 text-sm mb-6">
                Ouverture Juin 2025
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                Simplifiez la <span className="text-primary">gestion</span> de vos budgets achats
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
                Sapajoo simplifie et sécurise votre processus de suivi de budgets achats avec une plateforme intuitive et complète. 
                Rejoignez notre liste d'attente pour être parmi les premiers à y accéder.
              </p>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Rejoignez la liste d'attente</h3>
                <WaitingListForm />
                <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Soyez les premiers à découvrir notre solution
                </p>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="relative rounded-2xl shadow-2xl overflow-hidden">
                <img 
                  src="/placeholder.svg" 
                  alt="Aperçu Sapajoo" 
                  className="w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-primary text-white p-3 rounded-xl shadow-lg">
                  <div className="text-sm font-medium">Lancement Prévu</div>
                  <div className="text-xl font-bold">Juin 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités principales
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez comment Sapajoo peut révolutionner votre workflow et vous faire gagner du temps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="bg-primary/10 rounded-lg p-3 text-xl">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24 px-4 md:px-8 lg:px-16 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Un processus simple en trois étapes pour transformer votre gestion administrative
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "1. Configurez vos budgets",
                description: "Définissez facilement vos budgets par département, projet ou catégorie de dépenses.",
                icon: "🔧"
              },
              {
                title: "2. Gérez vos commandes",
                description: "Créez, approuvez et suivez vos bons de commande de manière centralisée.",
                icon: "📝"
              },
              {
                title: "3. Analysez vos dépenses",
                description: "Visualisez vos performances et optimisez vos processus grâce à des tableaux de bord intuitifs.",
                icon: "📈"
              }
            ].map((step, index) => (
              <div key={index} className="text-center p-6">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-2xl">
                  {step.icon}
                </div>
                <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonial Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-gray-50">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Ce que nos clients disent
              </h2>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-md">
              <p className="text-xl text-gray-700 italic mb-6">
                "Sapajoo a complètement transformé notre gestion des commandes. Nous économisons environ 15 heures par semaine sur les tâches administratives."
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="font-semibold">Sophie Martin</p>
                  <p className="text-gray-500 text-sm">Responsable Achats, Entreprise XYZ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 px-4 md:px-8 lg:px-16 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto text-gray-900">
            Prêt à révolutionner votre gestion des commandes?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Rejoignez notre liste d'attente dès maintenant et soyez parmi les premiers à découvrir Sapajoo.
          </p>
          
          <div className="max-w-md mx-auto bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <WaitingListForm />
          </div>
          
          <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
            <Button size="lg" className="text-white hover:bg-primary/90 group transition-all duration-300">
              Demander une démo <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="hover:bg-gray-50">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 lg:px-16 bg-gray-50 text-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="bg-white p-2 rounded-lg">
                  <img 
                    src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
                    alt="Logo" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <span className="ml-3 font-bold text-xl">Sapajoo</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Simplifiez votre processus d'achat et de gestion des bons de commande avec notre plateforme innovante.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Liens</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Accueil</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-600">contact@sapajoo.com</li>
                <li className="text-gray-600">+33 1 23 45 67 89</li>
                <li className="text-gray-600">Paris, France</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0 text-gray-600">
              &copy; {new Date().getFullYear()} Sapajoo. Tous droits réservés.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-primary transition-colors">
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
