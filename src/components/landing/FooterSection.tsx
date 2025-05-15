
import React from 'react';
import { NavLink } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="bg-accent pt-0 pb-8 w-screen overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
