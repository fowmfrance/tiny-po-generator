import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import Layout from './components/Layout';
import Index from './pages/Index';
import MentionsLegales from './pages/MentionsLegales';
import CutOffSimulator from './pages/CutOffSimulator';
import CutOffClosing from './pages/CutOffClosing';
import Banks from './pages/Banks';
import Budgets from './pages/Budgets';
import CreateBudget from './pages/CreateBudget';
import BudgetDetails from './pages/BudgetDetails';
import PurchaseOrders from './pages/PurchaseOrders';
import CreatePO from './pages/CreatePO';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Annuaire from './pages/Annuaire';
import DAS2 from './pages/DAS2';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SupplierPortal from './pages/SupplierPortal';
import SupplierPOView from './pages/SupplierPOView';
import SupplierPortalAccess from './pages/SupplierPortalAccess';
import NotFound from './pages/NotFound';
import Unsubscribe from './pages/Unsubscribe';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import MilestoneReport from './pages/MilestoneReport';
import PriceBenchmark from './pages/PriceBenchmark';
import ProtectedBackofficeRoute from './components/backoffice/ProtectedBackofficeRoute';
import BackofficeLayout from './components/backoffice/BackofficeLayout';
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import BackofficeOrganizations from './pages/backoffice/BackofficeOrganizations';
import BackofficeUsers from './pages/backoffice/BackofficeUsers';
import BackofficePermissions from './pages/backoffice/BackofficePermissions';
import BackofficePaymentMethods from './pages/backoffice/BackofficePaymentMethods';
import BackofficeSupplierTypes from './pages/backoffice/BackofficeSupplierTypes';
import BackofficeNormalizeNames from './pages/backoffice/BackofficeNormalizeNames';

function App() {
  return (
    <TooltipProvider>
      <Router>
        {/* Remove logo from here since it's now in the header */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
        <Route path="/cut-off-simulator" element={<ProtectedRoute><Layout><CutOffSimulator /></Layout></ProtectedRoute>} />
        <Route path="/cloture" element={<ProtectedRoute><Layout><CutOffClosing /></Layout></ProtectedRoute>} />
        <Route path="/banques" element={<ProtectedRoute><Layout><Banks /></Layout></ProtectedRoute>} />
        <Route path="/banks" element={<Navigate to="/banques" replace />} />
        <Route path="/budgets" element={<ProtectedRoute><Layout><Budgets /></Layout></ProtectedRoute>} />
        <Route path="/budgets/create" element={<ProtectedRoute><Layout><CreateBudget /></Layout></ProtectedRoute>} />
        <Route path="/budgets/:id" element={<ProtectedRoute><Layout><BudgetDetails /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders" element={<ProtectedRoute><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders/create" element={<ProtectedRoute><Layout><CreatePO /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders/:id" element={<ProtectedRoute><Layout><PurchaseOrderDetail /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders/:id/edit" element={<ProtectedRoute><Layout><CreatePO /></Layout></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><Layout><Vendors /></Layout></ProtectedRoute>} />
        <Route path="/vendors/:id" element={<ProtectedRoute><Layout><VendorDetail /></Layout></ProtectedRoute>} />
        <Route path="/annuaire" element={<ProtectedRoute><Layout><Annuaire /></Layout></ProtectedRoute>} />
        <Route path="/das2" element={<ProtectedRoute><Layout><DAS2 /></Layout></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><Layout><Payments /></Layout></ProtectedRoute>} />
        <Route path="/invoices" element={<Navigate to="/payments" replace />} />
        <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        <Route path="/benchmark" element={<ProtectedRoute><Layout><PriceBenchmark /></Layout></ProtectedRoute>} />
        <Route path="/milestones" element={<ProtectedRoute><Layout><MilestoneReport /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/supplier" element={<SupplierPortal />} />
        <Route path="/supplier/purchaseorders/:token" element={<SupplierPOView />} />
        <Route path="/supplier/portal/:token" element={<SupplierPortalAccess />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        {/* Back-office Sapajoo */}
        <Route path="/backoffice" element={<ProtectedBackofficeRoute><BackofficeLayout /></ProtectedBackofficeRoute>}>
          <Route index element={<BackofficeDashboard />} />
          <Route path="organizations" element={<BackofficeOrganizations />} />
          <Route path="users" element={<BackofficeUsers />} />
          <Route path="permissions" element={<BackofficePermissions />} />
          <Route path="payment-methods" element={<BackofficePaymentMethods />} />
          <Route path="supplier-types" element={<BackofficeSupplierTypes />} />
          <Route path="normalize-names" element={<BackofficeNormalizeNames />} />
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </TooltipProvider>
  );
}

export default App;
