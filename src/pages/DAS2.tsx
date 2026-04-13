import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

const DAS2 = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">DAS2</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Construction className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Page en construction</h2>
          <p className="text-muted-foreground max-w-md">
            La déclaration DAS2 sera bientôt disponible. Cette fonctionnalité permettra de générer automatiquement
            la déclaration des honoraires et commissions versés à des tiers.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DAS2;
