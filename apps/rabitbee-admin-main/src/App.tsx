
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AuthRoute from "@/components/AuthRoute";
import AdminRoute from "@/components/AdminRoute";
import { TenantProvider } from "@/contexts/TenantContext";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/admin/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import Groups from "./pages/admin/Groups";
import Tenants from "./pages/admin/Tenants";
import States from "./pages/admin/States";
import Districts from "./pages/admin/Districts";
import Zones from "./pages/admin/Zones";
import Areas from "./pages/admin/Areas";
import Categories from "./pages/admin/Categories";
import Subcategories from "./pages/admin/Subcategories";
import Products from "./pages/admin/Products";
import Tags from "./pages/admin/Tags";
import Units from "./pages/admin/Units";
import ServiceProviders from "./pages/admin/ServiceProviders";
import Settings from "./pages/admin/Settings";
import AdminLayout from "./components/admin/AdminLayout";
import Holidays from "./pages/admin/Holidays";
import HolidaySurcharges from "./pages/admin/HolidaySurcharges";
import Banners from "./pages/admin/Banners";
import Screens from "./pages/admin/Screens";
import PeakHours from "./pages/admin/PeakHours";
import DistanceBrackets from "./pages/admin/DistanceBrackets";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Restaurants from "./pages/admin/Restaurants";
import RestaurantCategories from "./pages/admin/RestaurantCategories";
import MenuItems from "./pages/admin/MenuItems";
import RestaurantOffers from "./pages/admin/RestaurantOffers";
import Orders from "./pages/admin/Orders";
import WalletManagement from "./pages/admin/WalletManagement";
import WashVehicleTypes from "./pages/admin/WashVehicleTypes";
import WashVehicleModels from "./pages/admin/WashVehicleModels";
import WashTypes from "./pages/admin/WashTypes";
import WashTimeSlots from "./pages/admin/WashTimeSlots";
import WashSlotOverrides from "./pages/admin/WashSlotOverrides";
import WashBookings from "./pages/admin/WashBookings";
import DeliveryAgents from "./pages/admin/DeliveryAgents";
import SurgePricing from "./pages/admin/SurgePricing";
import AreaZones from "./pages/admin/AreaZones";
import PromoCodes from "./pages/admin/PromoCodes";
import EchoItems from "./pages/admin/EchoItems";
import OrderMap from "./pages/admin/OrderMap";
import RestaurantEarnings from "./pages/admin/RestaurantEarnings";
import SupportTickets from "./pages/admin/SupportTickets";
import TableLanding from "./pages/TableLanding";
import TableMenu from "./pages/TableMenu";
import TableCart from "./pages/TableCart";
import TableCheckout from "./pages/TableCheckout";
import OrderTracking from "./pages/OrderTracking";
import TableQRCodes from "./pages/admin/TableQRCodes";
import TableOrderStatus from "./pages/TableOrderStatus";
import RestaurantTableOrders from "./pages/admin/RestaurantTableOrders";
import RestaurantDashboard from "./pages/admin/restaurant/RestaurantDashboard";
import ServiceProviderDashboard from "./pages/admin/ServiceProviderDashboard";

function App() {
  return (
    <Router>
      <TenantProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Table Ordering Routes */}
            <Route path="/table/:tableId/restaurant/:restaurantId" element={<TableLanding />} />
            <Route path="/table/:tableId/restaurant/:restaurantId/menu" element={<TableMenu />} />
            <Route path="/table/:tableId/restaurant/:restaurantId/cart" element={<TableCart />} />
            <Route path="/table/:tableId/restaurant/:restaurantId/checkout" element={<TableCheckout />} />
            <Route path="/table/:tableId/restaurant/:restaurantId/order/:orderId" element={<TableOrderStatus />} />
            <Route path="/table/:tableId/restaurant/:restaurantId/order/:orderId/track" element={<OrderTracking />} />
            
            <Route path="/admin/login" element={<Login />} />
            
            {/* Restaurant Dashboard Route - without admin layout */}
            <Route path="/restaurant/:restaurantId/*" element={
              <AuthRoute>
                <RestaurantDashboard />
              </AuthRoute>
            } />
            
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={
                <AuthRoute requirePermission="manage_users">
                  <Users />
                </AuthRoute>
              } />
              <Route path="roles" element={
                <AuthRoute requirePermission="manage_roles">
                  <Roles />
                </AuthRoute>
              } />
              <Route path="groups" element={
                <AuthRoute requirePermission="manage_users">
                  <Groups />
                </AuthRoute>
              } />
              <Route path="tenants" element={
                <AuthRoute requirePermission="manage_tenants">
                  <Tenants />
                </AuthRoute>
              } />
              <Route path="states" element={
                <AuthRoute requirePermission="manage_states">
                  <States />
                </AuthRoute>
              } />
              <Route path="districts" element={
                <AuthRoute requirePermission="manage_districts">
                  <Districts />
                </AuthRoute>
              } />
              <Route path="zones" element={
                <AuthRoute requirePermission="manage_zones">
                  <Zones />
                </AuthRoute>
              } />
              <Route path="areas" element={
                <AuthRoute requirePermission="manage_areas">
                  <Areas />
                </AuthRoute>
              } />
              <Route path="categories" element={
                <AuthRoute requirePermission="manage_categories">
                  <Categories />
                </AuthRoute>
              } />
              <Route path="subcategories" element={
                <AuthRoute requirePermission="manage_subcategories">
                  <Subcategories />
                </AuthRoute>
              } />
              <Route path="products" element={
                <AuthRoute requirePermission="manage_products">
                  <Products />
                </AuthRoute>
              } />
              <Route path="tags" element={
                <AuthRoute requirePermission="manage_tags">
                  <Tags />
                </AuthRoute>
              } />
              <Route path="units" element={
                <AuthRoute requirePermission="manage_units">
                  <Units />
                </AuthRoute>
              } />
              <Route path="echo-items" element={
                <AuthRoute requirePermission="manage_echo_items">
                  <EchoItems />
                </AuthRoute>
              } />
              <Route path="service-providers" element={
                <AuthRoute requirePermission="manage_service_providers">
                  <ServiceProviders />
                </AuthRoute>
              } />
              <Route path="service-provider/:providerId" element={
                <AuthRoute>
                  <ServiceProviderDashboard />
                </AuthRoute>
              } />
              <Route path="delivery-agents" element={
                <AuthRoute requirePermission="manage_service_providers">
                  <DeliveryAgents />
                </AuthRoute>
              } />
              <Route path="settings" element={<Settings />} />
              <Route path="promo-codes" element={
                <AuthRoute requirePermission="manage_business_settings">
                  <PromoCodes />
                </AuthRoute>
              } />
              <Route path="holidays" element={
                <AuthRoute requirePermission="manage_holidays">
                  <Holidays />
                </AuthRoute>
              } />
              <Route path="holiday-surcharges" element={
                <AuthRoute requirePermission="manage_business_settings">
                  <HolidaySurcharges />
                </AuthRoute>
              } />
              <Route path="screens" element={
                <AuthRoute requirePermission="manage_screens">
                  <Screens />
                </AuthRoute>
              } />
              <Route path="banners" element={
                <AuthRoute requirePermission="manage_banners">
                  <Banners />
                </AuthRoute>
              } />
              <Route path="peak-hours" element={
                <AuthRoute requirePermission="manage_peak_hours">
                  <PeakHours />
                </AuthRoute>
              } />
              <Route path="surge-pricing" element={
                <AuthRoute requirePermission="manage_business_settings">
                  <SurgePricing />
                </AuthRoute>
              } />
              <Route path="distance-brackets" element={
                <AuthRoute requirePermission="manage_business_settings">
                  <DistanceBrackets />
                </AuthRoute>
              } />
              <Route path="area-zones" element={
                <AuthRoute requirePermission="manage_business_settings">
                  <AreaZones />
                </AuthRoute>
              } />
              <Route path="restaurants" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <Restaurants />
                </AuthRoute>
              } />
              <Route path="restaurant-categories" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <RestaurantCategories />
                </AuthRoute>
              } />
              <Route path="menu-items" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <MenuItems />
                </AuthRoute>
              } />
              <Route path="restaurant-offers" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <RestaurantOffers />
                </AuthRoute>
              } />
              <Route path="orders" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <Orders />
                </AuthRoute>
              } />
              <Route path="order-map" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <OrderMap />
                </AuthRoute>
              } />
              <Route path="restaurant-earnings" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <RestaurantEarnings />
                </AuthRoute>
              } />
              <Route path="support-tickets" element={
                <AuthRoute requirePermission="manage_all">
                  <SupportTickets />
                </AuthRoute>
              } />
              <Route path="wallet-management" element={
                <AuthRoute requirePermission="manage_finance">
                  <WalletManagement />
                </AuthRoute>
              } />
              <Route path="wash-vehicle-types" element={<WashVehicleTypes />} />
              <Route path="wash-vehicle-models" element={<WashVehicleModels />} />
              <Route path="wash-types" element={<WashTypes />} />
              <Route path="wash-time-slots" element={<WashTimeSlots />} />
              <Route path="wash-slot-overrides" element={<WashSlotOverrides />} />
              <Route path="wash-bookings" element={<WashBookings />} />
              <Route path="table-qr-codes" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <TableQRCodes />
                </AuthRoute>
              } />
              <Route path="restaurant-table-orders" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <RestaurantTableOrders />
                </AuthRoute>
              } />
              <Route path="restaurant/:restaurantId" element={
                <AuthRoute requirePermission="manage_restaurants">
                  <RestaurantDashboard />
                </AuthRoute>
              } />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TenantProvider>
    </Router>
  );
}

export default App;
