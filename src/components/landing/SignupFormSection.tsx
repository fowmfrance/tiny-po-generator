import React from 'react';
import SignupForm from '@/components/SignupForm';

const SignupFormSection = () => {
  return (
    <section id="signup" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="bg-foreground text-background rounded-[28px] p-8 md:p-16 [&_p[id$='-form-item-message']]:text-brand-subtle [&_p[id$='-form-item-message']]:font-medium">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl mb-4 text-background">
              Rejoignez la liste d'attente
            </h2>
            <p className="text-background/70 text-lg">
              Soyez parmi les premiers à découvrir Sapajoo.
            </p>
          </div>
          <div className="max-w-2xl">
            <SignupForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignupFormSection;
