
import React from 'react';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import SignupFormSection from '@/components/landing/SignupFormSection';
import FooterSection from '@/components/landing/FooterSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SignupFormSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
