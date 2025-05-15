
import React from 'react';
import SignupForm from '@/components/SignupForm';

const SignupFormSection = () => {
  return (
    <section id="signup" className="py-20 relative overflow-hidden w-full"> 
      {/* Background with gradient rotation - expanded to ensure full width coverage */}
      <div className="absolute inset-0 w-screen h-full overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full" 
          style={{
            backgroundImage: "url('/lovable-uploads/3e7266e2-138f-4e51-b06f-f2aa51e97150.png')",
            backgroundSize: "cover",
            backgroundPosition: "left bottom",
            opacity: 0.25,
            transform: "rotate(270deg)"
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 md:px-8 lg:px-16 relative z-10">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-marie p-8 md:p-12">
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
