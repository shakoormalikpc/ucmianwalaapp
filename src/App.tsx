import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Payments from "./pages/Payments";
import Donations from "./pages/Donations";
import Designations from "./pages/Designations";
import Activities from "./pages/Activities";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/fund" element={<Donations />} />
              <Route path="/donations" element={<Navigate to="/fund" replace />} />
              <Route path="/designations" element={<Designations />} />
              <Route path="/activities" element={<Activities />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
