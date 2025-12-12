import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import MissionSection from '@/components/landing/MissionSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import SignupFormSection from '@/components/landing/SignupFormSection';
import FooterSection from '@/components/landing/FooterSection';

const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Sapajoo - Gestion des achats et contrôle budgétaire pour TPE/PME</title>
        <meta name="description" content="Sapajoo est la solution SaaS de gestion des dépenses, procurement et contrôle budgétaire pour TPE et PME. Idéal pour la direction financière à temps partagé." />
      </Helmet>
      
      <main className="min-h-screen flex flex-col overflow-x-hidden w-full relative">
        <Header />
        
        <article itemScope itemType="https://schema.org/WebPage">
          <HeroSection />
          <MissionSection />
          <FeaturesSection />
          <HowItWorksSection />
          <FAQSection />
        </article>
        
        {/* Contact section and footer with gradient background */}
        <footer className="relative">
          <div 
            className="absolute inset-0 w-full h-full -z-10" 
            style={{
              backgroundImage: "url('/lovable-uploads/e52049c0-6ccd-4165-9d7a-3003172c2fa5.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.85,
            }}
          />
          <SignupFormSection />
          <FooterSection />
        </footer>
      </main>
    </>
  );
};

export default LandingPage;
