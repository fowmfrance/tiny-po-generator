
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortalHeader from '@/components/supplier/PortalHeader';
import SupplierLoginForm from '@/components/supplier/SupplierLoginForm';
import GuestInvoiceForm from '@/components/supplier/GuestInvoiceForm';
import TestCredentialsInfo from '@/components/supplier/TestCredentialsInfo';

const SupplierPortal: React.FC = () => {
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <PortalHeader />

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="guest">Invité</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <SupplierLoginForm setError={setError} />
            </TabsContent>
            
            <TabsContent value="guest">
              <GuestInvoiceForm setError={setError} />
            </TabsContent>
          </Tabs>
          
          {error && (
            <div className="text-red-500 text-sm mt-4">{error}</div>
          )}
          
          <TestCredentialsInfo />
        </div>
      </div>
    </div>
  );
};

export default SupplierPortal;
