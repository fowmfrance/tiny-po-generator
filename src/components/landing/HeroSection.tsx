import React, { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-16 md:py-24 px-4 md:px-8 lg:px-16 overflow-hidden">
      {/* Gradient background overlay */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/lovable-uploads/3e7266e2-138f-4e51-b06f-f2aa51e97150.png')",
            backgroundSize: "cover",
            backgroundPosition: "right center",
            opacity: 0.25,
          }}
        />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Full width heading with animation */}
        <div className="mb-12 text-center">
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight",
              "transition-all duration-700 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            Gérez vos achats sans ERP&nbsp;!
          </h1>
        </div>

        {/* Two columns: paragraph and image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8 md:pr-4 lg:pr-8">
            <p
              className={cn(
                "text-base md:text-lg lg:text-xl text-muted-foreground",
                "transition-all duration-700 delay-300 ease-out",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              Sapajoo est une solution SaaS tout-en-un et intuitive qui vous permet de structurer et de sécuriser votre
              processus d'achat, de l'enregistrement de vos fournisseurs au règlement de leurs factures, en passant par
              la pré-comptabilité et l'affectation budgétaire des dépenses.
            </p>
            <p
              className={cn(
                "font-semibold text-foreground text-base md:text-lg lg:text-xl",
                "transition-all duration-700 delay-300 ease-out",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
            >
              Fini les dépenses non budgétées et les factures oubliées.
            </p>
          </div>

          {/* Right Column - Dashboard Image with animation */}
          <div
            className={cn(
              "relative",
              "transition-all duration-700 delay-700 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
          >
            <div className="bg-white rounded-2xl shadow-marie w-full max-w-sm sm:max-w-md md:max-w-none mx-auto">
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
