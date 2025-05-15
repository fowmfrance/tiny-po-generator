
import React from 'react';
import SignupForm from '@/components/SignupForm';

const SignupFormSection = () => {
  return (
    <section id="signup" className="py-24 relative overflow-hidden bg-transparent">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Rejoignez notre liste d'attente
            </h2>
            <p className="text-gray-600">
              Soyez parmi les premiers à découvrir comment Sapajoo peut révolutionner votre processus d'achat
            </p>
          </div>
          
          <SignupForm />
        </div>
      </div>
    </section>
  );
};

export default SignupFormSection;
