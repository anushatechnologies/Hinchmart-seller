export const NAV_GROUPS = [
  {
    group: 'MAIN',
    items: [
      {
        title: 'Dashboard',
        path: '/seller/dashboard',
        icon: 'LayoutDashboard',
      },
      {
        title: 'Orders',
        path: '/seller/orders',
        icon: 'ShoppingCart',
        badgeKey: 'newOrdersCount',
      },
      {
        title: 'RFQs / Quotations',
        path: '/seller/quotations',
        icon: 'FileText',
        badgeKey: 'newEnquiriesCount',
        children: [
          { title: 'All Quotations', path: '/seller/quotations' },
          { title: 'Buyer Enquiries (RFQs)', path: '/seller/enquiries' },
          { title: 'Create Quotation', path: '/seller/quotations/create' },
        ],
      },
      {
        title: 'Customers',
        path: '/seller/customers',
        icon: 'Users',
      },

      {
        title: 'Inventory',
        path: '/seller/inventory',
        icon: 'Warehouse',
        badgeKey: 'lowStockCount',
        children: [
          { title: 'Stock Overview', path: '/seller/inventory' },
          { title: 'Low Stock Alert', path: '/seller/inventory/low-stock', badgeKey: 'lowStockCount' },
          { title: 'Warehouses', path: '/seller/inventory/warehouses' },
        ],
      },
    ],
  },
  {
    group: 'CATALOG MANAGEMENT',
    items: [
      {
        title: 'My Storefront',
        path: '/seller/store',
        icon: 'Store',
      },
      {
        title: 'Categories',
        path: '/seller/categories',
        icon: 'Tag',
        children: [
          { title: 'Subcategories', path: '/seller/subcategories', icon: 'Layers' },
          { title: 'Brands', path: '/seller/brands', icon: 'Building2' },
          { title: 'Products', path: '/seller/products', icon: 'Package' },
        ],
      },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      {
        title: 'Invoices',
        path: '/seller/invoices',
        icon: 'Receipt',
      },
      {
        title: 'Payments',
        path: '/seller/payments',
        icon: 'CreditCard',
        badgeKey: 'pendingPaymentsCount',
      },
      {
        title: 'Price Management',
        path: '/seller/pricing',
        icon: 'Tag',
        children: [
          { title: 'Price List', path: '/seller/pricing' },
          { title: 'Bulk Pricing', path: '/seller/pricing/bulk' },
          { title: 'Price Settings', path: '/seller/pricing/settings' },
        ],
      },
    ],
  },
  {
    group: 'LOGISTICS',
    items: [
      {
        title: 'Dispatches',
        path: '/seller/dispatches',
        icon: 'Truck',
      },
      {
        title: 'Tracking',
        path: '/seller/tracking',
        icon: 'Navigation',
      },
    ],
  },
  {
    group: 'ANALYTICS',
    items: [
      {
        title: 'Reports / Analytics',
        path: '/seller/analytics',
        icon: 'BarChart3',
      },
    ],
  },
  {
    group: 'BUSINESS',
    items: [
      {
        title: 'Business Profile',
        path: '/seller/company/profile',
        icon: 'Building2',
        children: [
          { title: 'Company Overview', path: '/seller/company/profile' },
          { title: 'Business Details', path: '/seller/company/business-details' },
          { title: 'Statutory Verification', path: '/seller/company/verification' },
        ],
      },
      {
        title: 'Documents',
        path: '/seller/company/documents',
        icon: 'FileCheck',
      },
    ],
  },
];

// Flat export for compatibility
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
