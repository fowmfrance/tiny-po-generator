
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Router>
      <div className="w-full flex justify-center pt-6">
        <img 
          src="/lovable-uploads/e108d857-cf1f-487c-8ddf-e170435be97a.png" 
          alt="Logo Sapajoo" 
          className="h-72 w-auto object-contain" // Augmenté à 300% (h-24 → h-72)
        />
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
