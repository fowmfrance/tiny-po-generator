
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Mark component as mounted
    setMounted(true);
    
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check for scroll position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  if (!mounted) {
    return null; // Return null on server to prevent hydration mismatch
  }
  
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 px-6 transition-all duration-300",
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo on the left side */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/6c09108a-5adb-49a5-9224-982268aef474.png" 
            alt="Sapajoo" 
            className="h-36 w-auto object-contain" /* Changed from h-12 to h-36 (300% increase) */
            style={{ 
              display: "block",
              visibility: "visible",
              opacity: 1,
              width: "auto",
              minWidth: "100px"
            }} 
          />
        </div>
        
        {/* Navigation on the right side */}
        <nav className="hidden sm:block">
          <ul className="flex space-x-8">
            <li>
              <a 
                href="#mission" 
                className={cn(
                  "font-medium hover:text-primary transition-colors",
                  scrolled ? "text-gray-800" : "text-white"
                )}
              >
                Mission
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className={cn(
                  "font-medium hover:text-primary transition-colors",
                  scrolled ? "text-gray-800" : "text-white"
                )}
              >
                Fonctionnalités
              </a>
            </li>
            <li>
              <a 
                href="#avantages" 
                className={cn(
                  "font-medium hover:text-primary transition-colors",
                  scrolled ? "text-gray-800" : "text-white"
                )}
              >
                Avantages
              </a>
            </li>
            <li>
              <a 
                href="#signup" 
                className={cn(
                  "font-medium hover:text-primary transition-colors",
                  scrolled ? "text-gray-800" : "text-white"
                )}
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
