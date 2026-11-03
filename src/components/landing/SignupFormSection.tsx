
import React from 'react';
import SignupForm from '@/components/SignupForm';

const SignupFormSection = () => {
  return (
    <section id="signup" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl mb-6 text-primary">
              Rejoignez la liste d'attente
            </h2>
            <p className="text-muted-foreground">
              Soyez parmi les premiers à découvrir Sapajoo.
            </p>
          </div>
          
          <SignupForm />
        </div>
      </div>
    </section>
  );
};

export default SignupFormSection;
