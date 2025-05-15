
import React from 'react';
import { NavLink } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="bg-accent py-6 w-screen overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Logo section */}
          <div className="text-center md:text-left">
            <img 
              src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
              alt="Sapajoo Logo" 
              className="h-14 mb-4 mx-auto md:mx-0"
            />
            <p className="text-gray-600">Simplifiez votre gestion d'achats</p>
          </div>
          
          {/* Quick links */}
          <div className="text-center md:text-left">
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
        <div className="text-center mt-8 border-t border-gray-200 pt-6">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Sapajoo. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
