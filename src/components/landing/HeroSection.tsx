
import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const HeroSection = () => {
  return (
    <section className="pt-16 pb-20 px-4 md:px-8 lg:px-16">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 max-w-2xl">
            <div className="inline-block bg-[#39FF14] text-white font-bold rounded-full px-6 py-2 text-sm mb-8 transform rotate-[5deg]">
              Bientôt!
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-primary leading-tight">
              Reprenez la main sur la gestion de vos achats
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-4 leading-relaxed">
              Sapajoo simplifie et sécurise votre processus de suivi de budgets achats avec une plateforme intuitive et complète, depuis l'enregistrement fournisseur jusqu'au paiement.
            </p>
            <p className="text-lg md:text-xl text-gray-700 mb-10 leading-relaxed">
              Rejoignez notre liste d'attente pour être parmi les premiers à y accéder!
            </p>
          </div>
          
          <div className="flex-1 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <AspectRatio ratio={16/9} className="bg-muted">
                <div className="w-full h-full overflow-hidden">
                  <img 
                    src="/lovable-uploads/a198a451-2774-4214-9a03-acf2d7dc0877.png" 
                    alt="Tableau de bord Sapajoo" 
                    className="w-[130%] h-full object-cover object-[30px_center]"
                    style={{ marginLeft: "-50px" }}
                  />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
