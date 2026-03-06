import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import POSBilling from "./pages/POSBilling";
import MedicinesPage from "./pages/MedicinesPage";
import InventoryPage from "./pages/InventoryPage";
import ReportsPage from "./pages/ReportsPage";
import StaffPage from "./pages/StaffPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import CustomersPage from "./pages/CustomersPage";
import PurchasesPage from "./pages/PurchasesPage";
import SuppliersPage from "./pages/SuppliersPage";
import StockAlertsPage from "./pages/StockAlertsPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import ReturnsPage from "./pages/ReturnsPage";
import ExpensesPage from "./pages/ExpensesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/pos" element={<POSBilling />} />
          <Route path="/medicines" element={<AppLayout><MedicinesPage /></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><InventoryPage /></AppLayout>} />
          <Route path="/purchases" element={<AppLayout><PurchasesPage /></AppLayout>} />
          <Route path="/suppliers" element={<AppLayout><SuppliersPage /></AppLayout>} />
          <Route path="/customers" element={<AppLayout><CustomersPage /></AppLayout>} />
          <Route path="/prescriptions" element={<AppLayout><PrescriptionsPage /></AppLayout>} />
          <Route path="/expiry" element={<AppLayout><StockAlertsPage /></AppLayout>} />
          <Route path="/returns" element={<AppLayout><ReturnsPage /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
          <Route path="/expenses" element={<AppLayout><ExpensesPage /></AppLayout>} />
          <Route path="/staff" element={<AppLayout><StaffPage /></AppLayout>} />
          <Route path="/activity" element={<AppLayout><ActivityLogPage /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
