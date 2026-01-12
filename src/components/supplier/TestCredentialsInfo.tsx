
import React from 'react';

const TestCredentialsInfo: React.FC = () => {
  // Only show demo credentials in development mode
  const isDev = import.meta.env.DEV;
  
  if (!isDev) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            Mode Démo (Dev uniquement)
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Pour le test, utilisez:</p>
        <p className="mt-1"><strong>Email:</strong> procurement@apple.com</p>
        <p><strong>Mot de passe:</strong> demo123</p>
        <p className="mt-1"><strong>Numéro BC:</strong> 2023-001</p>
      </div>
    </div>
  );
};

export default TestCredentialsInfo;
