import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminAuthProvider } from "@/features/admin/auth/AdminAuthProvider";
import { RequireAdminAuth } from "@/features/admin/auth/RequireAdminAuth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AboutUs from "@/pages/AboutUs";
import Services from "@/pages/Services";
import Tracking from "@/pages/Tracking";
import Contact from "@/pages/Contact";
import ResetPassword from "@/pages/ResetPassword";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminShipmentsPage from "@/pages/admin/AdminShipmentsPage";
import AdminShipmentDetailPage from "@/pages/admin/AdminShipmentDetailPage";
import { useEffect } from "react";

type ShipmentRouteProps = {
  params: {
    id: string;
  };
};

function ProtectedAdminShipmentsRoute() {
  return (
    <RequireAdminAuth>
      <AdminShipmentsPage />
    </RequireAdminAuth>
  );
}

function ProtectedAdminShipmentDetailRoute({ params }: ShipmentRouteProps) {
  return (
    <RequireAdminAuth>
      <AdminShipmentDetailPage shipmentId={params.id} />
    </RequireAdminAuth>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/shipments" component={ProtectedAdminShipmentsRoute} />
      <Route
        path="/admin/shipments/:id"
        component={ProtectedAdminShipmentDetailRoute}
      />
      <Route path="/" component={Home} />
      <Route path="/about-us" component={AboutUs} />
      <Route path="/about" component={AboutUs} />
      <Route path="/services" component={Services} />
      <Route path="/tracking" component={Tracking} />
      <Route path="/contact" component={Contact} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminAuthProvider>
          <Toaster />
          <Router />
        </AdminAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
