
import React from 'react';
import { Link } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="bg-gray-100 py-10 px-4 md:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div>
            <h4 className="font-semibold text-lg mb-4">À propos</h4>
            <p className="text-gray-600 mb-4">
              Sapajoo est une plateforme complète et intuitive de gestion des achats conçues pour les PME/TPE
            </p>
          </div>
          
          {/* Column 2 */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Liens</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-600 hover:text-blue-600">Accueil</Link></li>
              <li><Link to="/features" className="text-gray-600 hover:text-blue-600">Fonctionnalités</Link></li>
            </ul>
          </div>
          
          {/* Column 3 */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <p className="text-gray-600 mb-2">hello@sapajoo.fr</p>
          </div>
        </div>
        
        {/* Centered Legal Links */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link to="/mentions-legales" className="text-gray-600 hover:text-blue-600">
            Mentions Légales
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
