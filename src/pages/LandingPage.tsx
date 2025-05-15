
import React from 'react';
import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import MissionSection from '@/components/landing/MissionSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SignupFormSection from '@/components/landing/SignupFormSection';
import FooterSection from '@/components/landing/FooterSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden w-full relative">
      {/* No background gradient for the top part */}
      
      <Header />
      <HeroSection />
      <MissionSection />
      <FeaturesSection />
      <HowItWorksSection />
      
      {/* Contact section and footer with gradient background */}
      <div className="relative">
        {/* Background gradient image limited to this section */}
        <div 
          className="absolute inset-0 w-full h-full -z-10" 
          style={{
            backgroundImage: "url('/lovable-uploads/e52049c0-6ccd-4165-9d7a-3003172c2fa5.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 1,
          }}
        />
        <SignupFormSection />
        <FooterSection />
      </div>
    </div>
  );
};

export default LandingPage;
