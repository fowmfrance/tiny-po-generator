import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import Index from './pages/Index';
import MentionsLegales from './pages/MentionsLegales';
import CutOffSimulator from './pages/CutOffSimulator';

function App() {
  return (
    <Router>
      {/* Remove logo from here since it's now in the header */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout><Index /></Layout>} />
        <Route path="/cut-off-simulator" element={<Layout><CutOffSimulator /></Layout>} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
