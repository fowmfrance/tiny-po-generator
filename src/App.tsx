
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import PurchaseOrders from "./pages/PurchaseOrders";
import CreatePO from "./pages/CreatePO";
import Vendors from "./pages/Vendors";
import Budgets from "./pages/Budgets";
import BudgetDetails from "./pages/BudgetDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/budgets/:budgetId" element={<BudgetDetails />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/create" element={<CreatePO />} />
            <Route path="/vendors" element={<Vendors />} />
            {/* Placeholder routes for future implementation */}
            <Route path="/invoices" element={<div className="p-6">Invoices Page (Coming Soon)</div>} />
            <Route path="/reports" element={<div className="p-6">Reports Page (Coming Soon)</div>} />
            <Route path="/settings" element={<div className="p-6">Settings Page (Coming Soon)</div>} />
          </Route>
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
