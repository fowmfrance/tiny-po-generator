
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300",
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex justify-end items-center">
        <nav>
          <ul className="flex space-x-8">
            <li>
              <a 
                href="#mission" 
                className="text-gray-800 font-medium hover:text-primary transition-colors"
              >
                Mission
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className="text-gray-800 font-medium hover:text-primary transition-colors"
              >
                Fonctionnalités
              </a>
            </li>
            <li>
              <a 
                href="#avantages" 
                className="text-gray-800 font-medium hover:text-primary transition-colors"
              >
                Avantages
              </a>
            </li>
            <li>
              <a 
                href="#signup" 
                className="text-gray-800 font-medium hover:text-primary transition-colors"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
