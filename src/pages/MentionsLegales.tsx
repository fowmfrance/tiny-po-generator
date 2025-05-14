
import React from 'react';
import { Link } from 'react-router-dom';
import FooterSection from '@/components/landing/FooterSection';

const MentionsLegales = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-grow container mx-auto py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-8">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Retour à l'accueil
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-8 text-center">Mentions Légales</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600">
              Le contenu des mentions légales sera bientôt disponible.
            </p>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};

export default MentionsLegales;
