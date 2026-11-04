import React, { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const [email, setEmail] = useState("");

  const handlePrefill = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem("sapajoo_prefill_email", email.trim());
    window.dispatchEvent(new Event("sapajoo:prefill"));
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  const anim = (delay: string) =>
    cn("transition-all duration-700 ease-out", delay, visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4");

  return (
    <section className="relative bg-background pt-28 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-center">
        <div className="space-y-6 md:pr-4 lg:pr-8 text-left">
          <h1 className={cn("text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight", anim(""))}>
            Gérez vos achats sans ERP&nbsp;!
          </h1>
          <p className={cn("text-base md:text-lg lg:text-xl text-muted-foreground", anim("delay-300"))}>
            Sapajoo est une solution SaaS tout-en-un et intuitive qui vous permet de structurer et de sécuriser votre
            processus d'achat, de l'enregistrement de vos fournisseurs au règlement de leurs factures, en passant par
            la pré-comptabilité et l'affectation budgétaire des dépenses.
          </p>
          <p className={cn("font-semibold text-foreground text-base md:text-lg lg:text-xl", anim("delay-300"))}>
            Fini les dépenses non budgétées et les factures oubliées.
          </p>
          <form onSubmit={handlePrefill} className={cn("flex flex-wrap gap-2 max-w-xl", anim("delay-500"))}>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse e-mail professionnelle"
              aria-label="Adresse e-mail professionnelle"
              className="h-12 flex-1 min-w-[220px] rounded-[10px] border-input bg-card text-foreground"
            />
            <Button
              type="submit"
              className="h-12 bg-brand text-brand-foreground hover:bg-brand/90 rounded-[10px] font-semibold px-6"
            >
              Rejoindre la liste d'attente
            </Button>
          </form>
        </div>

        <div className={cn("relative", anim("delay-700"))}>
          <div className="rounded-2xl border border-border shadow-lg overflow-hidden bg-card w-full max-w-sm sm:max-w-md md:max-w-none mx-auto">
            <AspectRatio ratio={16 / 9}>
              <img
                src="/lovable-uploads/41f94066-11be-48b2-bf11-fcf946feb3af.png"
                alt="Tableau de bord Sapajoo"
                className="w-full h-full object-contain"
              />
            </AspectRatio>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
