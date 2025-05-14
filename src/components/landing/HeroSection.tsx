
import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white overflow-hidden">
      <div className="container mx-auto">
        {/* Full width heading */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
            Simplifiez vos achats d'entreprise
          </h1>
        </div>
        
        {/* Two columns: paragraph and image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 lg:pr-8">
            <p className="text-lg md:text-xl text-gray-600">
              Sapajoo est une solution tout-en-un qui transforme votre processus d'achats indirects, de la demande au paiement, sans les complications habituelles d'un ERP.
            </p>
          </div>
          
          {/* Right Column - Dashboard Image */}
          <div className="relative">
            <div className="bg-white p-3 rounded-2xl shadow-marie">
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
