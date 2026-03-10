import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { trackPageView } from "./lib/analytics";
import ScrollToTop from "./components/ScrollToTop";
import SEO from "./components/SEO";
import { useSiteContent, isPageEnabled } from "./hooks/useSiteContent";
import MiniPelles from "./pages/MiniPelles";
import PortalHome from "./pages/PortalHome";
import ModularHomes from "./pages/ModularHomes";
import ModularStandard from "@/pages/ModularStandard";
import ModularPremium from "./pages/ModularPremium";
import CampingCarDeluxe from "./pages/CampingCarDeluxe";
import Solar from "./pages/Solar";
import SolarKitDetail from "./pages/SolarKitDetail";
import Agriculture from "./pages/Agriculture";
import ProductDetail from "./pages/ProductDetail";
import Accessories from "@/pages/Accessories";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Delivery from "./pages/Delivery";
import Legal from "./pages/Legal";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";

function PageGuard({ pageKey, component: Component }: { pageKey: string; component: React.ComponentType }) {
  const { content, loading } = useSiteContent();
  if (loading) return null;
  const enabled = isPageEnabled(content, pageKey);
  if (!enabled) return <NotFound />;
  return <Component />;
}

function App() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return (
    <>
      <ScrollToTop />
      <SEO />
      <Switch>
        <Route path="/" component={PortalHome} />
        <Route path="/minipelles">{() => <PageGuard pageKey="minipelles" component={MiniPelles} />}</Route>
        <Route path="/maisons">{() => <PageGuard pageKey="maisons" component={ModularHomes} />}</Route>
        <Route path="/maisons/standard">{() => <PageGuard pageKey="maisons" component={ModularStandard} />}</Route>
        <Route path="/maisons/premium">{() => <PageGuard pageKey="maisons" component={ModularPremium} />}</Route>
        <Route path="/maisons/camping-car-deluxe">{() => <PageGuard pageKey="maisons" component={CampingCarDeluxe} />}</Route>
        <Route path="/solaire">{() => <PageGuard pageKey="solaire" component={Solar} />}</Route>
        <Route path="/solaire/:slug">{() => <PageGuard pageKey="solaire" component={SolarKitDetail} />}</Route>
        <Route path="/agricole">{() => <PageGuard pageKey="agricole" component={Agriculture} />}</Route>
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/accessoires">{() => <PageGuard pageKey="accessoires" component={Accessories} />}</Route>
        <Route path="/cart" component={Cart} />
        <Route path="/terms">{() => <PageGuard pageKey="terms" component={Terms} />}</Route>
        <Route path="/privacy">{() => <PageGuard pageKey="privacy" component={Privacy} />}</Route>
        <Route path="/delivery">{() => <PageGuard pageKey="delivery" component={Delivery} />}</Route>
        <Route path="/legal">{() => <PageGuard pageKey="legal" component={Legal} />}</Route>
        <Route path="/services">{() => <PageGuard pageKey="services" component={Services} />}</Route>
        <Route path="/contact">{() => <PageGuard pageKey="contact" component={Contact} />}</Route>
        <Route path="/about">{() => <PageGuard pageKey="about" component={About} />}</Route>
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/:rest*" component={AdminLayout} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default App;
