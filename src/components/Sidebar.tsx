
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Receipt, 
  PieChart, 
  Settings, 
  Home,
  DollarSign
} from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-sidebar flex flex-col text-white">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/05950649-a2f8-4ab3-a057-d204deaaf513.png" 
            alt="Sapajoo Logo" 
            className="h-8 w-auto filter brightness-0 invert"
          />
          <div>
            <h1 className="text-xl font-bold">Sapajoo</h1>
            <p className="text-sm text-gray-300">Système de Bons de Commande</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
              end
            >
              <Home className="w-5 h-5 mr-3" />
              Tableau de Bord
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/budgets" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <DollarSign className="w-5 h-5 mr-3" />
              Budgets
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/purchase-orders" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <FileText className="w-5 h-5 mr-3" />
              Bons de Commande
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/vendors" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Users className="w-5 h-5 mr-3" />
              Fournisseurs
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/invoices" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Receipt className="w-5 h-5 mr-3" />
              Factures
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <PieChart className="w-5 h-5 mr-3" />
              Rapports
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
              isActive ? 'bg-sidebar-accent font-medium' : ''
            }`
          }
        >
          <Settings className="w-5 h-5 mr-3" />
          Paramètres
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
