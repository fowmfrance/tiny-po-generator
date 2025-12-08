import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import Index from './pages/Index';
import MentionsLegales from './pages/MentionsLegales';
import CutOffSimulator from './pages/CutOffSimulator';
import Banks from './pages/Banks';
import Budgets from './pages/Budgets';
import CreateBudget from './pages/CreateBudget';
import BudgetDetails from './pages/BudgetDetails';
import PurchaseOrders from './pages/PurchaseOrders';
import CreatePO from './pages/CreatePO';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SupplierPortal from './pages/SupplierPortal';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierGuestInvoice from './pages/SupplierGuestInvoice';
import SupplierInvoiceCreate from './pages/SupplierInvoiceCreate';
import SupplierPOView from './pages/SupplierPOView';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      {/* Remove logo from here since it's now in the header */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Index /></Layout></ProtectedRoute>} />
        <Route path="/cut-off-simulator" element={<ProtectedRoute><Layout><CutOffSimulator /></Layout></ProtectedRoute>} />
        <Route path="/banks" element={<ProtectedRoute><Layout><Banks /></Layout></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><Layout><Budgets /></Layout></ProtectedRoute>} />
        <Route path="/budgets/create" element={<ProtectedRoute><Layout><CreateBudget /></Layout></ProtectedRoute>} />
        <Route path="/budgets/:id" element={<ProtectedRoute><Layout><BudgetDetails /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders" element={<ProtectedRoute><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders/create" element={<ProtectedRoute><Layout><CreatePO /></Layout></ProtectedRoute>} />
        <Route path="/purchase-orders/:id" element={<ProtectedRoute><Layout><PurchaseOrderDetail /></Layout></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute><Layout><Vendors /></Layout></ProtectedRoute>} />
        <Route path="/vendors/:id" element={<ProtectedRoute><Layout><VendorDetail /></Layout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
        <Route path="/supplier" element={<SupplierPortal />} />
        <Route path="/supplier/dashboard/:vendorId" element={<SupplierDashboard />} />
        <Route path="/supplier/invoice/guest" element={<SupplierGuestInvoice />} />
        <Route path="/supplier/invoice/create/:vendorId" element={<SupplierInvoiceCreate />} />
        <Route path="/supplier/purchaseorders/:vendorId" element={<SupplierPOView />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
