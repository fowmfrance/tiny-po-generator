
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  PieChart, 
  Settings, 
  Home,
  Euro,
  CreditCard,
  Calculator,
  Building2,
  Flag
} from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="group w-16 hover:w-64 h-screen bg-sidebar flex flex-col text-white transition-all duration-300 ease-in-out overflow-hidden">
      <div className="p-2 flex justify-center items-center group-hover:justify-start group-hover:pl-4 mb-2">
        <img 
          src="/lovable-uploads/dd8cc652-cc2e-49de-86f9-89455143f476.png" 
          alt="Logo" 
          className="h-12 group-hover:h-24 w-auto object-contain filter brightness-0 invert transition-all duration-300"
        />
      </div>
      
      <nav className="flex-1 p-2 group-hover:p-4 pt-0">
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
              end
            >
              <Home className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Tableau de Bord</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/budgets" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Euro className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Budgets</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/purchase-orders" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <FileText className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Bons de Commande</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/vendors" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Users className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Fournisseurs</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/payments" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <CreditCard className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Paiements</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <PieChart className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Rapports</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/milestones" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Flag className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Suivi jalons</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/cut-off-simulator" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Calculator className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Cut-off Simulator</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/banques" 
              className={({ isActive }) => 
                `flex items-center justify-center group-hover:justify-start p-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
                  isActive ? 'bg-sidebar-accent font-medium' : ''
                }`
              }
            >
              <Building2 className="w-5 h-5 min-w-5 group-hover:mr-3" />
              <span className="hidden group-hover:inline whitespace-nowrap">Banques</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
