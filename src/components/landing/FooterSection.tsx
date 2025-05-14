
import React from 'react';
import { Link } from 'react-router-dom';

const FooterSection = () => {
  return (
    <footer className="py-16 px-4 md:px-8 lg:px-16 bg-primary text-white">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
            <p className="text-white mb-6 max-w-md italic">
              Sapajoo, la plateforme de gestion des achats pensée pour les PME
            </p>
          </div>
          
          <div className="flex justify-center">
            <div>
              <h3 className="font-bold text-white mb-4 text-center">Liens</h3>
              <ul className="space-y-2 text-center">
                <li><Link to="/" className="text-white hover:text-gray-200 transition-colors">Accueil</Link></li>
                <li><Link to="/" className="text-white hover:text-gray-200 transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/" className="text-white hover:text-gray-200 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-white">contact@sapajoo.fr</li>
              <li className="text-white flex items-center">
                Made with <span className="mx-1 text-white">❤️</span> in Paris
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 flex flex-wrap items-center justify-between text-xs">
          <div className="text-white">
            &copy; {new Date().getFullYear()} FOWM. Tous droits réservés.
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/mentions-legales" className="text-white hover:text-gray-200 transition-colors">
              Mentions légales
            </Link>
            
            <a 
              href="https://www.linkedin.com/company/106470208/"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
