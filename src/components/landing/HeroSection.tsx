
import React from 'react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-16 bg-white overflow-hidden">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 lg:pr-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight">
              Simplifiez vos achats d'entreprise
            </h1>
            <p className="text-lg md:text-xl text-gray-600">
              Sapajoo est une solution tout-en-un qui transforme votre processus d'achats indirects, de la demande au paiement, sans les complications habituelles d'un ERP.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg">
                <Link to="#signup" className="flex items-center gap-2">
                  Demander un accès <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right Column - Dashboard Image */}
          <div className="relative">
            <div className="bg-white p-3 rounded-2xl shadow-marie">
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl">
                <div className="w-full h-full overflow-hidden">
                  <img 
                    src="/lovable-uploads/a198a451-2774-4214-9a03-acf2d7dc0877.png" 
                    alt="Tableau de bord Sapajoo" 
                    className="w-[150%] h-full object-cover object-[80px_center]"
                    style={{ marginLeft: "-100px" }}
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
