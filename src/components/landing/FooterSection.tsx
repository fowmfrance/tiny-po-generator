
import React from 'react';
import { Link } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="bg-gray-100 py-2 px-4 md:px-8">
      <div className="container mx-auto">
        {/* Logo in the footer */}
        <div className="flex justify-center mb-4">
          <img 
            src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
            alt="Sapajoo" 
            className="h-8 w-auto object-contain"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Column 1 */}
          <div>
            <h4 className="font-semibold text-sm mb-1">À propos</h4>
            <p className="text-gray-600 text-xs mb-2">
              Sapajoo est une plateforme complète et intuitive de gestion des achats conçues pour les PME/TPE
            </p>
          </div>
          
          {/* Column 2 */}
          <div>
            <h4 className="font-semibold text-sm mb-1">Liens</h4>
            <ul className="space-y-0.5">
              <li><Link to="/" className="text-gray-600 hover:text-blue-600 text-xs">Accueil</Link></li>
              <li><Link to="/features" className="text-gray-600 hover:text-blue-600 text-xs">Fonctionnalités</Link></li>
            </ul>
          </div>
          
          {/* Column 3 */}
          <div>
            <h4 className="font-semibold text-sm mb-1">Contact</h4>
            <p className="text-gray-600 text-xs mb-1">hello@sapajoo.fr</p>
            <a 
              href="https://www.linkedin.com/company/sapajoo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-gray-600 hover:text-blue-600 text-xs"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="#002856" 
                className="w-4 h-4 mr-1"
              >
                <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 00.1.47V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
              </svg>
            </a>
          </div>
        </div>
        
        {/* Centered Legal Links */}
        <div className="mt-2 pt-1 border-t border-gray-200 text-center">
          <Link to="/mentions-legales" className="text-gray-600 hover:text-blue-600 text-xs">
            Mentions Légales
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
