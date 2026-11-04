
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
      className="fixed top-0 left-0 right-0 z-50 h-[68px] bg-background/85 backdrop-blur border-b border-border"
    >
      <div className="mx-auto max-w-6xl h-full px-4 md:px-8 flex justify-between items-center">
        {/* Logo on the left side */}
        <div className="flex items-center">
          <img
            src="/sapajoo-logo.svg"
            alt="Sapajoo"
            className="h-10 w-auto"
          />
        </div>

        
        {/* Navigation on the right side */}
        <nav className="flex items-center gap-8">
          <ul className="hidden lg:flex space-x-8">
            <li>
              <a 
                href="#mission" 
                className={cn(
                  "font-medium hover:text-brand transition-colors",
                  "text-foreground"
                )}
              >
                Mission
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                className={cn(
                  "font-medium hover:text-brand transition-colors",
                  "text-foreground"
                )}
              >
                Fonctionnalités
              </a>
            </li>
            <li>
              <a 
                href="#avantages" 
                className={cn(
                  "font-medium hover:text-brand transition-colors",
                  "text-foreground"
                )}
              >
                Comment ça marche
              </a>
            </li>
            <li>
              <a 
                href="#signup" 
                className={cn(
                  "font-medium hover:text-brand transition-colors",
                  "text-foreground"
                )}
              >
                Contact
              </a>
            </li>
          </ul>
          <Link to="/auth">
            <Button 
              variant="outline"
              className="rounded-[10px] border-border bg-transparent text-foreground hover:bg-secondary"
              size="sm"
            >
              Se connecter
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
