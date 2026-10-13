import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layout
import { SellerLayout } from '../components/layout/SellerLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { VerifyOtpPage } from '../pages/auth/VerifyOtpPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { BusinessOnboardingPage } from '../pages/auth/BusinessOnboardingPage';
import { PendingApprovalPage } from '../pages/auth/PendingApprovalPage';

// Dashboard
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Products
import { ProductsListPage } from '../pages/products/ProductsListPage';
import { AddProductPage } from '../pages/products/AddProductPage';
import { EditProductPage } from '../pages/products/EditProductPage';
import { ProductDetailPage } from '../pages/products/ProductDetailPage';
import { BulkUploadPage } from '../pages/products/BulkUploadPage';
import { CategoriesPage } from '../pages/products/CategoriesPage';
import { SubcategoriesPage } from '../pages/catalog/SubcategoriesPage';
import { BrandsPage } from '../pages/catalog/BrandsPage';
import { ArchivedProductsPage } from '../pages/products/ArchivedProductsPage';

// Labels
import { LabelGeneratorPage } from '../pages/labels/LabelGeneratorPage';
import { LabelHistoryPage } from '../pages/labels/LabelHistoryPage';

// Customers
import { CustomersListPage } from '../pages/customers/CustomersListPage';
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage';



// Pricing
import { PriceManagementPage } from '../pages/pricing/PriceManagementPage';
import { BulkPricingPage } from '../pages/pricing/BulkPricingPage';
import { PriceSettingsPage } from '../pages/pricing/PriceSettingsPage';

// Inventory
import { InventoryStockPage } from '../pages/inventory/InventoryStockPage';
import { LowStockPage } from '../pages/inventory/LowStockPage';
import { WarehousesPage } from '../pages/inventory/WarehousesPage';

// Orders
import { OrdersListPage } from '../pages/orders/OrdersListPage';
import { CreateOrderPage } from '../pages/orders/CreateOrderPage';
import { OrderDetailPage } from '../pages/orders/OrderDetailPage';

// Finance & Logistics
import { InvoicesListPage } from '../pages/invoices/InvoicesListPage';
import { PaymentsListPage } from '../pages/payments/PaymentsListPage';
import { DispatchesListPage } from '../pages/logistics/DispatchesListPage';
import { TrackingPage } from '../pages/logistics/TrackingPage';

// Enquiries
import { BuyerEnquiriesPage } from '../pages/enquiries/BuyerEnquiriesPage';

// Quotations
import { QuotationsListPage } from '../pages/quotations/QuotationsListPage';
import { CreateQuotationPage } from '../pages/quotations/CreateQuotationPage';
import { QuotationDetailPage } from '../pages/quotations/QuotationDetailPage';

// Company
import { CompanyProfilePage } from '../pages/company/CompanyProfilePage';
import { BusinessDetailsPage } from '../pages/company/BusinessDetailsPage';
import { DocumentsPage } from '../pages/company/DocumentsPage';
import { VerificationPage } from '../pages/company/VerificationPage';

// Analytics
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';

// Notifications
import { NotificationsPage } from '../pages/notifications/NotificationsPage';

// Store Setup
import { StoreSetupPage } from '../pages/store/StoreSetupPage';

// Settings
import { SettingsPage } from '../pages/settings/SettingsPage';
import { useAuthStore } from '../store/authStore';

export function AppRoutes() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/seller/dashboard' : '/login'} replace />}
      />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/seller/dashboard" replace /> : <LoginPage />}
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />
      <Route path="/seller/pending-approval" element={<PendingApprovalPage />} />

      {/* Seller Onboarding Redirect */}
      <Route
        path="/seller/onboarding"
        element={<Navigate to="/pending-approval" replace />}
      />

      {/* Protected Seller Portal Layout */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* 4-Tier Catalog Management */}
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="subcategories" element={<SubcategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/add" element={<AddProductPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="products/:id/edit" element={<EditProductPage />} />
        <Route path="products/bulk-upload" element={<BulkUploadPage />} />
        <Route path="products/categories" element={<Navigate to="/seller/categories" replace />} />
        <Route path="products/archived" element={<ArchivedProductsPage />} />
        <Route path="products/labels" element={<LabelGeneratorPage />} />
        <Route path="products/labels/history" element={<LabelHistoryPage />} />

        {/* Customers */}
        <Route path="customers" element={<CustomersListPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />

        {/* Catalog Management (Redirect old /catalogues path to /products) */}
        <Route path="catalogues" element={<Navigate to="/seller/products" replace />} />
        <Route path="catalogues/*" element={<Navigate to="/seller/products" replace />} />

        {/* Pricing */}
        <Route path="pricing" element={<PriceManagementPage />} />
        <Route path="pricing/bulk" element={<BulkPricingPage />} />
        <Route path="pricing/settings" element={<PriceSettingsPage />} />

        {/* Inventory */}
        <Route path="inventory" element={<InventoryStockPage />} />
        <Route path="inventory/low-stock" element={<LowStockPage />} />
        <Route path="inventory/warehouses" element={<WarehousesPage />} />

        {/* Orders */}
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/create" element={<CreateOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />

        {/* Finance */}
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="payments" element={<PaymentsListPage />} />

        {/* Logistics */}
        <Route path="dispatches" element={<DispatchesListPage />} />
        <Route path="tracking" element={<TrackingPage />} />

        {/* Enquiries */}
        <Route path="enquiries" element={<BuyerEnquiriesPage />} />

        {/* Quotations */}
        <Route path="quotations" element={<QuotationsListPage />} />
        <Route path="quotations/create" element={<CreateQuotationPage />} />
        <Route path="quotations/:id" element={<QuotationDetailPage />} />

        {/* Company */}
        <Route path="company/profile" element={<CompanyProfilePage />} />
        <Route path="company/business-details" element={<BusinessDetailsPage />} />
        <Route path="company/documents" element={<DocumentsPage />} />
        <Route path="company/verification" element={<VerificationPage />} />

        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsPage />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Store Management & Setup (Phase 3) */}
        <Route path="store" element={<StoreSetupPage />} />
        <Route path="store/setup" element={<StoreSetupPage />} />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/seller/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
