
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Linkedin } from 'lucide-react';

const FooterSection = () => {
  return (
    <footer className="relative py-4 w-full mt-auto">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo section - moved closer to center */}
          <div className="text-center md:text-left md:pl-4">
            <h2 className="text-white text-xs mb-2">
              Sapajoo (<span className="font-bold">LA</span> plateforme de gestion du process achat des PME/TPE)
            </h2>
            <NavLink to="/mentions-legales" className="text-white text-xs hover:underline transition-colors">
              Mentions légales
            </NavLink>
          </div>
          
          {/* Center section */}
          <div className="text-center flex items-center justify-center">
            <p className="text-white text-xs flex items-center">
              Fait avec <Heart className="mx-2 text-red-500" size={14} /> à Paris
            </p>
          </div>
          
          {/* Contact info - aligned left within the column and moved closer to center */}
          <div className="text-center md:text-left md:pl-10">
            <h3 className="text-white font-bold text-xs mb-2">Contact</h3>
            <p className="text-white text-xs mb-2">hello@sapajoo.fr</p>
            <a 
              href="https://linkedin.com/company/sapajoo" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="LinkedIn Sapajoo"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors"
            >
              <Linkedin size={16} aria-hidden="true" />
              <span className="sr-only">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
