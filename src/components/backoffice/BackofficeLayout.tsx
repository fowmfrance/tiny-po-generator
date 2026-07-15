import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, Shield, CreditCard, Briefcase, Type, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/backoffice', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/backoffice/organizations', icon: Building2, label: 'Organisations' },
  { to: '/backoffice/users', icon: Users, label: 'Utilisateurs' },
  { to: '/backoffice/permissions', icon: Shield, label: 'Permissions' },
  { to: '/backoffice/payment-methods', icon: CreditCard, label: 'Moyens de paiement' },
  { to: '/backoffice/supplier-types', icon: Briefcase, label: 'Catalogue métiers' },
  { to: '/backoffice/normalize-names', icon: Type, label: 'Normaliser les noms' },
];

const BackofficeLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-5 border-b">
          <h1 className="text-lg font-bold tracking-tight">Sapajoo Admin</h1>
          <p className="text-xs text-muted-foreground">Back-office</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default BackofficeLayout;
