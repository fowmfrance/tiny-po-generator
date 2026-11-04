
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

  const anim = (delay: string) => cn(
    'transition-all duration-700 ease-out', delay,
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
  );

  return (
    <section id="mission" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
        <h2 className={cn('text-3xl md:text-4xl lg:text-5xl text-foreground leading-tight', anim(''))}>
          Notre mission&nbsp;: rendre accessibles les bonnes pratiques de gestion des achats
        </h2>
        <div className="space-y-4">
          <div className={cn('bg-card border border-border rounded-2xl p-6 text-muted-foreground text-lg', anim('delay-150'))}>
            <strong className="font-semibold text-foreground">Un ERP&nbsp;?</strong> Trop lourd, et trop cher pour la plupart des PME.
          </div>
          <div className={cn('bg-card border border-border rounded-2xl p-6 text-muted-foreground text-lg', anim('delay-300'))}>
            <strong className="font-semibold text-foreground">Un outil d'achat spécialisé&nbsp;?</strong> Il existe, mais ses circuits de validation sont complexes et son prix reste hors de portée des TPE et PME.
          </div>
          <div className={cn('bg-brand-subtle border border-brand/20 rounded-2xl p-6 text-foreground text-lg', anim('delay-500'))}>
            <strong className="font-semibold">Sapajoo</strong> propose une alternative accessible, techniquement et financièrement, au plus grand nombre.
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;
