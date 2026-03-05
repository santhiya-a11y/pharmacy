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
import PlaceholderPage from "./components/PlaceholderPage";
import NotFound from "./pages/NotFound";
import {
  Package, Truck, UserCircle, FileText, AlertTriangle,
  Tags, RotateCcw, BarChart3, Wallet, UserCog, Activity, Settings
} from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/pos" element={<AppLayout><POSBilling /></AppLayout>} />
          <Route path="/medicines" element={<AppLayout><MedicinesPage /></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><InventoryPage /></AppLayout>} />
          <Route path="/purchases" element={<AppLayout><PlaceholderPage title="Purchase Management" description="Manage purchase orders, goods received notes, and supplier invoices." icon={Package} /></AppLayout>} />
          <Route path="/suppliers" element={<AppLayout><PlaceholderPage title="Supplier Management" description="Track suppliers, pricing, credit terms, and order history." icon={Truck} /></AppLayout>} />
          <Route path="/customers" element={<AppLayout><PlaceholderPage title="Customer Management" description="Manage customer profiles, loyalty programs, and purchase history." icon={UserCircle} /></AppLayout>} />
          <Route path="/prescriptions" element={<AppLayout><PlaceholderPage title="Prescription Management" description="Upload, scan, and manage doctor prescriptions with OCR." icon={FileText} /></AppLayout>} />
          <Route path="/expiry" element={<AppLayout><PlaceholderPage title="Expiry & Dead Stock" description="Track expiring medicines, manage returns, and reduce losses." icon={AlertTriangle} /></AppLayout>} />
          <Route path="/offers" element={<AppLayout><PlaceholderPage title="Offers & Discounts" description="Create product discounts, loyalty rewards, and supplier schemes." icon={Tags} /></AppLayout>} />
          <Route path="/returns" element={<AppLayout><PlaceholderPage title="Returns Management" description="Process customer returns and supplier credit notes." icon={RotateCcw} /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />
          <Route path="/expenses" element={<AppLayout><PlaceholderPage title="Expense Tracking" description="Track daily expenses, overhead costs, and financial summaries." icon={Wallet} /></AppLayout>} />
          <Route path="/staff" element={<AppLayout><StaffPage /></AppLayout>} />
          <Route path="/activity" element={<AppLayout><PlaceholderPage title="Activity Log" description="View audit trail of all system actions and changes." icon={Activity} /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><PlaceholderPage title="Settings" description="Configure store details, GST, print templates, and system preferences." icon={Settings} /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
