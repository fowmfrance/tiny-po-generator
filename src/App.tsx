
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import Index from './pages/Index';

function App() {
  return (
    <Router>
      <div className="w-full flex justify-center pt-6">
        <img 
          src="/lovable-uploads/e108d857-cf1f-487c-8ddf-e170435be97a.png" 
          alt="Logo Sapajoo" 
          className="h-96 w-auto object-contain"
        />
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout><Index /></Layout>} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
