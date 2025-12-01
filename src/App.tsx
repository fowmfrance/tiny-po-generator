import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/toaster';
import Layout from './components/Layout';
import Index from './pages/Index';
import MentionsLegales from './pages/MentionsLegales';
import CutOffSimulator from './pages/CutOffSimulator';
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

function App() {
  return (
    <Router>
      {/* Remove logo from here since it's now in the header */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Layout><Index /></Layout>} />
        <Route path="/cut-off-simulator" element={<Layout><CutOffSimulator /></Layout>} />
        <Route path="/budgets" element={<Layout><Budgets /></Layout>} />
        <Route path="/budgets/create" element={<Layout><CreateBudget /></Layout>} />
        <Route path="/budgets/:id" element={<Layout><BudgetDetails /></Layout>} />
        <Route path="/purchase-orders" element={<Layout><PurchaseOrders /></Layout>} />
        <Route path="/purchase-orders/create" element={<Layout><CreatePO /></Layout>} />
        <Route path="/purchase-orders/:id" element={<Layout><PurchaseOrderDetail /></Layout>} />
        <Route path="/vendors" element={<Layout><Vendors /></Layout>} />
        <Route path="/vendors/:id" element={<Layout><VendorDetail /></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
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
