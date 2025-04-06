import React from 'react';
import WaitingListForm from '@/components/WaitingListForm';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-100 to-white pt-8 pb-24 px-4 md:px-8 lg:px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png')] bg-no-repeat bg-right-top opacity-5 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500 opacity-5 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4"></div>
        
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
              <div className="relative bg-gradient-to-tr from-blue-500 to-blue-600 rounded-2xl shadow-2xl p-0.5 transform rotate-1 transition-transform hover:rotate-0 duration-300">
                <div className="bg-white rounded-2xl overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt="Aperçu Sapajoo" 
                    className="w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-primary text-white p-4 rounded-xl shadow-lg transform transition-transform hover:scale-105 duration-300">
                  <div className="text-sm font-medium">Lancement Prévu</div>
                  <div className="text-xl font-bold">Juin 2025</div>
                </div>
              </div>
              
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-blue-200 rounded-full opacity-50 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24 px-4 md:px-8 lg:px-16 bg-landing-features text-white relative">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block bg-white/20 font-medium rounded-full px-4 py-1 text-sm mb-4">
              Fonctionnalités
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Transformez votre gestion administrative
            </h2>
            <p className="text-white/80 mt-4 max-w-2xl mx-auto">
              Découvrez comment Sapajoo peut révolutionner votre workflow et vous faire gagner du temps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <Card key={index} className="border border-gray-100 hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-br from-primary to-blue-400 w-12 h-12 flex items-center justify-center rounded-lg text-white mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonial Section */}
      <section className="py-20 px-4 md:px-8 lg:px-16 bg-landing text-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="inline-block bg-white/20 font-medium rounded-full px-4 py-1 text-sm">
                Témoignages
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              Ce que nos bêta-testeurs disent
            </h2>
            <div className="bg-white/10 p-8 rounded-2xl border border-white/20">
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-primary text-white rounded-full p-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10.5C10 9 9 8.5 8 8.5C6.5 8.5 5.5 10 5.5 12C5.5 15 7.5 16.5 10 16.5V14.5C8.5 14.5 7.5 13.5 7.5 12C7.5 11 8 10.5 8.5 10.5C9 10.5 9 11 9 11.5H10Z" fill="currentColor"/>
                  <path d="M18.5 10.5C18.5 9 17.5 8.5 16.5 8.5C15 8.5 14 10 14 12C14 15 16 16.5 18.5 16.5V14.5C17 14.5 16 13.5 16 12C16 11 16.5 10.5 17 10.5C17.5 10.5 17.5 11 17.5 11.5H18.5Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-xl text-gray-700 italic mb-6">
                "Sapajoo a complètement transformé notre gestion des commandes. Nous économisons environ 15 heures par semaine sur les tâches administratives."
              </p>
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
                <div className="ml-4 text-left">
                  <p className="font-semibold">Sophie Martin</p>
                  <p className="text-gray-500 text-sm">Responsable Achats, Entreprise XYZ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 px-4 md:px-8 lg:px-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-center opacity-5 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-300 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 max-w-3xl mx-auto">
            Prêt à révolutionner votre gestion des commandes?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Rejoignez notre liste d'attente dès maintenant et soyez parmi les premiers à découvrir Sapajoo.
          </p>
          
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/20">
            <WaitingListForm />
          </div>
          
          <div className="mt-16 flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10">
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-700 group transition-all duration-300">
              Demander une démo <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="link" className="text-white hover:text-blue-200">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 lg:px-16 bg-landing-footer text-gray-800">
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
                <span className="ml-3 font-bold text-white text-xl">Sapajoo</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Simplifiez votre processus d'achat et de gestion des bons de commande avec notre plateforme innovante.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-4">Liens</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Accueil</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">contact@sapajoo.com</li>
                <li className="text-gray-400">+33 1 23 45 67 89</li>
                <li className="text-gray-400">Paris, France</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Sapajoo. Tous droits réservés.
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.5 10.5C18.5 9 17.5 8.5 16.5 8.5C15 8.5 14 10 14 12C14 15 16 16.5 18.5 16.5V14.5C17 14.5 16 13.5 16 12C16 11 16.5 10.5 17 10.5C17.5 10.5 17.5 11 17.5 11.5H18.5Z" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.504.344-1.857.182-.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
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
