import React from 'react';
import PortalHeader from '@/components/supplier/PortalHeader';
import GuestInvoiceForm from '@/components/supplier/GuestInvoiceForm';

const SupplierPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <PortalHeader />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">Déposer une facture</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Si vous avez reçu un lien d'accès par email, utilisez-le pour accéder à votre espace complet.
            Sinon, vous pouvez déposer une facture en tant qu'invité ci-dessous.
          </p>
          <GuestInvoiceForm setError={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default SupplierPortal;
