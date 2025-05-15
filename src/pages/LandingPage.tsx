
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-white to-[#d0e5e9] overflow-x-hidden w-full">
      <Header />
      <HeroSection />
      <MissionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SignupFormSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
