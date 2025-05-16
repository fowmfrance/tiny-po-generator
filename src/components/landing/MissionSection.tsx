
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const MissionSection = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisible(true);
      }
    }, { threshold: 0.1 });
    
    const section = document.getElementById('mission');
    if (section) observer.observe(section);
    
    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);
  
  return (
    <section id="mission" className="py-20 px-4 md:px-8 lg:px-16 bg-transparent">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 
            className={cn(
              "text-3xl md:text-4xl font-bold text-primary mb-6",
              "transition-all duration-700 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Notre mission : démocratiser les meilleures pratiques en matière de gestion du cycle achats
          </h2>
          <p 
            className={cn(
              "text-gray-600 max-w-3xl mx-auto text-lg",
              "transition-all duration-700 delay-300 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <br>Un ERP? Surdimensionné par rapport aux flux et au budget outils de la plupart des PME...</br>
            Un outil d'achat ad hoc? Cela existe, mais les workflow de validation sont complexes et le budget là encore hors de portée des TPE/PME
            Sapajoo propose donc d'offrir au TPE/PME une alternative accessible techniquement et financièrement au plus grand nombre. Fini les dépenses non budgétées, les factures oubliées lors d'un exercice comptable!
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
