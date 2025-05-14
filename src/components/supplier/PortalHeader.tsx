
import React from 'react';

const PortalHeader: React.FC = () => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <img 
        src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
        alt="Sapajoo" 
        className="mx-auto h-16 w-auto object-contain"
      />
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Portail Fournisseur
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">
        Accédez à vos bons de commande et gérez vos factures
      </p>
    </div>
  );
};

export default PortalHeader;
