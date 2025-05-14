
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <Router>
      <div className="w-full flex justify-center pt-6">
        <img 
          src="/lovable-uploads/efe8955a-c370-4bed-ba41-e64efd80f9e6.png" 
          alt="Logo Sapajoo" 
          className="h-24 w-auto object-contain"
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
