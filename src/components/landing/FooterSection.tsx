
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Linkedin } from 'lucide-react';

const FooterSection = () => {
  return (
    <footer className="relative py-8 w-full mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo section - moved closer to center */}
          <div className="text-center md:text-left md:pl-4">
            <p className="text-muted-foreground text-xs mb-2">
              Sapajoo, la plateforme de gestion des achats pour les TPE et PME.
            </p>
            <NavLink to="/mentions-legales" className="text-muted-foreground text-xs hover:text-foreground hover:underline transition-colors">
              Mentions légales
            </NavLink>
          </div>
          
          {/* Center section */}
          <div className="text-center flex items-center justify-center">
            <p className="text-muted-foreground text-xs flex items-center">
              Fait avec <Heart className="mx-2 text-red-500" size={14} /> à Paris
            </p>
          </div>
          
          {/* Contact info - aligned left within the column and moved closer to center */}
          <div className="text-center md:text-left md:pl-10">
            <h3 className="text-muted-foreground text-xs mb-2">Contact</h3>
            <p className="text-muted-foreground text-xs mb-2">hello@sapajoo.fr</p>
            <a 
              href="https://linkedin.com/company/sapajoo" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="LinkedIn Sapajoo"
              className="inline-flex items-center text-muted-foreground hover:text-brand transition-colors"
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
