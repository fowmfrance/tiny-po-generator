
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetail from "./pages/PurchaseOrderDetail";
import CreatePO from "./pages/CreatePO";
import Vendors from "./pages/Vendors";
import VendorDetail from "./pages/VendorDetail";
import Budgets from "./pages/Budgets";
import BudgetDetails from "./pages/BudgetDetails";
import NotFound from "./pages/NotFound";
import SupplierPortal from "./pages/SupplierPortal";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierInvoiceCreate from "./pages/SupplierInvoiceCreate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main Application Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/budgets/:budgetId" element={<BudgetDetails />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="/purchase-orders/create" element={<CreatePO />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorDetail />} />
            {/* Placeholder routes for future implementation */}
            <Route path="/invoices" element={<div className="p-6">Invoices Page (Coming Soon)</div>} />
            <Route path="/reports" element={<div className="p-6">Reports Page (Coming Soon)</div>} />
            <Route path="/settings" element={<div className="p-6">Settings Page (Coming Soon)</div>} />
          </Route>
          
          {/* Supplier Portal Routes */}
          <Route path="/supplier" element={<SupplierPortal />} />
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/invoices/create" element={<SupplierInvoiceCreate />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
