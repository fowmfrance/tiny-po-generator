
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Redirect component to automatically go to dashboard
function RedirectToDashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  return null;
}

// Apply the redirect wrapper to App
function AppWithRedirect() {
  return (
    <App />
  );
}

createRoot(document.getElementById("root")!).render(<AppWithRedirect />);
