import { Switch, Route } from "wouter";
import ScrollToTop from "./components/ScrollToTop";
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
import Cart from "./pages/Cart";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";

function App() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/" component={PortalHome} />
      <Route path="/minipelles" component={MiniPelles} />
      <Route path="/maisons" component={ModularHomes} />
      <Route path="/maisons/standard" component={ModularStandard} />
      <Route path="/maisons/premium" component={ModularPremium} />
      <Route path="/maisons/camping-car-deluxe" component={CampingCarDeluxe} />
      <Route path="/solaire" component={Solar} />
      <Route path="/solaire/:slug" component={SolarKitDetail} />
      <Route path="/agricole" component={Agriculture} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/accessoires" component={Accessories} />
      <Route path="/cart" component={Cart} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/delivery" component={Delivery} />
      <Route path="/legal" component={Legal} />
      <Route path="/services" component={Services} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/:rest*" component={AdminLayout} />
    </Switch>
    </>
  );
}

export default App;
