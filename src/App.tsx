import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { DataProvider } from "@/contexts/DataContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import { DashboardLayout } from "./components/DashboardLayout";
import CompetitiveOverview from "./pages/dashboard/CompetitiveOverview";
import PricingPromoIntelligence from "./pages/dashboard/PricingPromoIntelligence";
import SearchShelfVisibility from "./pages/dashboard/SearchShelfVisibility";
import AssortmentIntelligence from "./pages/dashboard/AssortmentIntelligence";
import AvailabilityIntelligence from "./pages/dashboard/AvailabilityIntelligence";
import LocalMarketIntelligence from "./pages/dashboard/LocalMarketIntelligence";
import CompetitiveEvents from "./pages/dashboard/CompetitiveEvents";
import AnalyticsTaxonomy from "./pages/AnalyticsTaxonomy";
import ManageDatasets from "./pages/ManageDatasets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<CompetitiveOverview />} />
                <Route path="pricing" element={<PricingPromoIntelligence />} />
                <Route path="search" element={<SearchShelfVisibility />} />
                <Route path="assortment" element={<AssortmentIntelligence />} />
                <Route path="availability" element={<AvailabilityIntelligence />} />
                <Route path="local" element={<LocalMarketIntelligence />} />
                <Route path="events" element={<CompetitiveEvents />} />
              </Route>
              <Route path="/analytics-taxonomy" element={<AnalyticsTaxonomy />} />
              <Route path="/manage-datasets" element={<ManageDatasets />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </DataProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
