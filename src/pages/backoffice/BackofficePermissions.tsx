import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X } from 'lucide-react';

const roles = [
  {
    name: 'user',
    label: 'Utilisateur',
    description: 'Accès standard à son propre espace',
    permissions: { budgets: true, pos: true, vendors: true, invoices: true, reports: true, settings: false, backoffice: false },
  },
  {
    name: 'manager',
    label: 'Manager',
    description: 'Peut approuver les bons de commande',
    permissions: { budgets: true, pos: true, vendors: true, invoices: true, reports: true, settings: true, backoffice: false },
  },
  {
    name: 'admin',
    label: 'Admin Client',
    description: 'Administration complète de l\'espace client',
    permissions: { budgets: true, pos: true, vendors: true, invoices: true, reports: true, settings: true, backoffice: false },
  },
  {
    name: 'admin-sapajoo',
    label: 'Admin Sapajoo',
    description: 'Accès cross-tenant complet et back-office',
    permissions: { budgets: true, pos: true, vendors: true, invoices: true, reports: true, settings: true, backoffice: true },
  },
];

const permissionLabels: Record<string, string> = {
  budgets: 'Budgets',
  pos: 'Bons de commande',
  vendors: 'Fournisseurs',
  invoices: 'Factures',
  reports: 'Rapports',
  settings: 'Paramètres',
  backoffice: 'Back-office',
};

const BackofficePermissions: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matrice des Permissions</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble des rôles et droits d'accès</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Module</th>
                {roles.map(r => (
                  <th key={r.name} className="p-4 text-center font-medium">
                    <Badge variant={r.name === 'admin-sapajoo' ? 'destructive' : 'outline'} className="text-xs">
                      {r.label}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(permissionLabels).map(perm => (
                <tr key={perm} className="border-b">
                  <td className="p-4 font-medium">{permissionLabels[perm]}</td>
                  {roles.map(r => (
                    <td key={r.name} className="p-4 text-center">
                      {(r.permissions as Record<string, boolean>)[perm] ? (
                        <Check className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(r => (
          <Card key={r.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">{r.label}</CardTitle>
              </div>
              <CardDescription>{r.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BackofficePermissions;
