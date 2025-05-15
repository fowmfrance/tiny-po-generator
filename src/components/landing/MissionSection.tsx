
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
            Notre mission
          </h2>
          <p 
            className={cn(
              "text-gray-600 max-w-3xl mx-auto text-lg",
              "transition-all duration-700 delay-300 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Notre mission est de simplifier la gestion des achats indirects pour les entreprises, 
            en proposant une solution intuitive et complète qui élimine les complications 
            traditionnellement associées aux systèmes ERP.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
