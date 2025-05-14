
import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin } from 'lucide-react';

const FooterSection = () => {
  return (
    <footer className="py-8 px-4 md:px-8 lg:px-16 bg-primary text-white">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 */}
          <div className="md:col-span-1">
            <p className="text-white mb-4 max-w-md italic">
              Sapajoo, la plateforme de gestion des achats pensée pour les PME
            </p>
            <p className="text-white">Bientôt!</p>
          </div>
          
          {/* Column 2 */}
          <div className="flex justify-center">
            <div>
              <h3 className="font-bold text-white mb-3 text-center">Liens</h3>
              <ul className="space-y-2 text-center">
                <li><Link to="/" className="text-white hover:text-gray-200 transition-colors">Accueil</Link></li>
                <li><Link to="/" className="text-white hover:text-gray-200 transition-colors">Fonctionnalités</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Column 3 */}
          <div>
            <h3 className="font-bold text-white mb-3">Contact</h3>
            <ul className="space-y-2">
              <li className="text-white">contact@sapajoo.fr</li>
              <li className="text-white flex items-center">
                Made with <span className="mx-1 text-white">❤️</span> in Paris
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/106470208/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-200 transition-colors flex items-center"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4 mr-2" /> LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-center text-xs">
          <div className="text-white text-xs mr-4">
            &copy; {new Date().getFullYear()} FOWM. Tous droits réservés.
          </div>
          
          <div className="text-center">
            <Link to="/mentions-legales" className="text-white hover:text-gray-200 transition-colors text-xs">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
