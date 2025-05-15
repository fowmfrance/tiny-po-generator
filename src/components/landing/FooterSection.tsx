
import React from 'react';
import { Link } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="bg-gray-100 py-8 px-4 md:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div>
            <h4 className="font-semibold text-base mb-3">À propos</h4>
            <p className="text-gray-600 text-sm mb-3">
              Sapajoo est une plateforme complète et intuitive de gestion des achats conçues pour les PME/TPE
            </p>
          </div>
          
          {/* Column 2 */}
          <div>
            <h4 className="font-semibold text-base mb-3">Liens</h4>
            <ul className="space-y-1.5">
              <li><Link to="/" className="text-gray-600 hover:text-blue-600 text-sm">Accueil</Link></li>
              <li><Link to="/features" className="text-gray-600 hover:text-blue-600 text-sm">Fonctionnalités</Link></li>
            </ul>
          </div>
          
          {/* Column 3 */}
          <div>
            <h4 className="font-semibold text-base mb-3">Contact</h4>
            <p className="text-gray-600 text-sm mb-2">hello@sapajoo.fr</p>
            <a 
              href="https://www.linkedin.com/company/sapajoo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-gray-600 hover:text-blue-600 text-sm"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0077b5] text-white mr-2 text-xs font-semibold">
                in
              </div>
              LinkedIn
            </a>
          </div>
        </div>
        
        {/* Centered Legal Links */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Link to="/mentions-legales" className="text-gray-600 hover:text-blue-600 text-xs">
            Mentions Légales
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
