
import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white overflow-hidden">
      <div className="container mx-auto">
        {/* Full width heading */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight">
            Simplifiez vos achats d'entreprise
          </h1>
        </div>
        
        {/* Two columns: paragraph and navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content with Navigation */}
          <div className="space-y-8 lg:pr-8">
            <p className="text-lg md:text-xl text-gray-700 mb-6">
              Sapajoo est une solution tout-en-un qui transforme votre processus d'achats indirects, 
              de la demande au paiement, sans les complications habituelles d'un ERP.
            </p>
            
            {/* FOWM.io style navigation menu with more prominent hover effects */}
            <div className="flex flex-col space-y-5 text-left">
              <a 
                href="#features" 
                className="text-lg font-medium flex items-center group transition-colors duration-200 hover:text-primary"
              >
                <span className="text-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                Explorer les fonctionnalités
              </a>
              <a 
                href="#how-it-works" 
                className="text-lg font-medium flex items-center group transition-colors duration-200 hover:text-primary"
              >
                <span className="text-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                Découvrir comment ça marche
              </a>
              <a 
                href="#signup" 
                className="text-lg font-medium flex items-center group transition-colors duration-200 hover:text-primary"
              >
                <span className="text-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                Demander une démo
              </a>
            </div>
          </div>
          
          {/* Right Column - Dashboard Image */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-marie">
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl">
                <div className="w-full h-full overflow-hidden">
                  <img 
                    src="/lovable-uploads/41f94066-11be-48b2-bf11-fcf946feb3af.png" 
                    alt="Tableau de bord Sapajoo" 
                    className="w-full h-full object-contain"
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
