
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Linkedin } from 'lucide-react';

const FooterSection = () => {
  return (
    <footer className="relative bg-transparent py-6 w-full overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo section */}
          <div className="text-center md:text-left">
            <h2 className="text-navy text-xs mb-4">
              Sapajoo (<span className="font-bold">LA</span> plateforme de gestion du process achat des PME/TPE)
            </h2>
            <NavLink to="/mentions-legales" className="text-navy text-xs hover:underline transition-colors">
              Mentions légales
            </NavLink>
          </div>
          
          {/* Center section */}
          <div className="text-center flex items-center justify-center">
            <p className="text-navy text-xs flex items-center">
              Fait avec <Heart className="mx-2 text-red-500" size={14} /> à Paris
            </p>
          </div>
          
          {/* Contact info */}
          <div className="text-center md:text-right">
            <h3 className="text-navy font-bold text-xs mb-4">Contact</h3>
            <p className="text-navy text-xs mb-2">hello@sapajoo.fr</p>
            <a 
              href="https://linkedin.com/company/sapajoo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-navy hover:text-blue-300 transition-colors"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
