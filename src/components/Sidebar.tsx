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
      <div className="p-4 flex justify-start items-center pl-4 mb-2">
        <img 
          src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
          alt="Logo" 
          className="h-24 w-auto filter brightness-0 invert ml-1"
        />
      </div>
      
      <nav className="flex-1 p-4 pt-0">
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
