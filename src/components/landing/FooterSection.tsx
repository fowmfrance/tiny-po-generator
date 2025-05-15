
import React from 'react';
import { NavLink } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="bg-accent py-8 w-screen overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="flex flex-col items-center md:items-start">
            <img 
              src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
              alt="Sapajoo Logo" 
              className="h-12 mb-4"
            />
            <p className="text-gray-600 text-sm md:text-left text-center">
              Simplifiez votre gestion d'achats
            </p>
          </div>
          
          {/* Quick links */}
          <div className="text-center">
            <h3 className="text-primary font-medium mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/" className="text-gray-600 hover:text-primary transition-colors">
                  Accueil
                </NavLink>
              </li>
              <li>
                <NavLink to="/mentions-legales" className="text-gray-600 hover:text-primary transition-colors">
                  Mentions légales
                </NavLink>
              </li>
            </ul>
          </div>
          
          {/* Contact info */}
          <div className="text-center md:text-right">
            <h3 className="text-primary font-medium mb-4">Contact</h3>
            <p className="text-gray-600">hello@sapajoo.fr</p>
            <p className="text-gray-600 mt-2">Paris, France</p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Sapajoo. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
