import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import MenuPage from "./pages/MenuPage";
import OrderStatusPage from "./pages/OrderStatusPage";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import KitchenPage from "./pages/KitchenPage";
import WaiterPage from "./pages/WaiterPage";
import AdminPage from "./pages/AdminPage";
import QrCodesPage from "./pages/QrCodesPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu/:tableNumber" element={<MenuPage />} />
        <Route path="/order" element={<OrderStatusPage />} />
        <Route path="/order/:orderId" element={<OrderStatusPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/waiter" element={<WaiterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/qr" element={<QrCodesPage />} />
      </Route>
    </Routes>
  );
}
