
import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const HeroSection = () => {
  return (
    <section className="pt-16 pb-20 px-4 md:px-8 lg:px-16 bg-white">
      <div className="container mx-auto">
        <div className="flex justify-center items-center mb-16">
          <img 
            src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
            alt="Logo Sapajoo" 
            className="h-16 w-auto object-contain"
          />
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
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <AspectRatio ratio={16/9} className="bg-muted">
                <img 
                  src="/lovable-uploads/05950649-a2f8-4ab3-a057-d204deaaf513.png" 
                  alt="Tableau de bord Sapajoo" 
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
