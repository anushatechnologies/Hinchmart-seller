import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAME_MAP = {
  seller: 'Seller Portal',
  dashboard: 'Dashboard',
  products: 'Products',
  add: 'Add Product',
  edit: 'Edit Product',
  'bulk-upload': 'Bulk Upload',
  categories: 'Categories',
  subcategories: 'Subcategories',
  brands: 'Brands',
  archived: 'Archived Products',
  labels: 'Product Labels',
  create: 'Create',
  pricing: 'Pricing',
  bulk: 'Bulk Pricing',
  settings: 'Settings',
  inventory: 'Inventory',
  'low-stock': 'Low Stock Alert',
  warehouses: 'Warehouses',
  orders: 'Orders',
  enquiries: 'Buyer Enquiries',
  quotations: 'Quotations',
  company: 'Company',
  profile: 'Company Profile',
  'business-details': 'Business Details',
  documents: 'Documents',
  verification: 'Verification',
  analytics: 'Analytics',
  notifications: 'Notifications',
};

export function Breadcrumb({ customItems }) {
  const location = useLocation();

  if (customItems) {
    return (
      <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
        <Link to="/seller/dashboard" className="hover:text-slate-800 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
        </Link>
        {customItems.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {item.path ? (
              <Link to={item.path} className="hover:text-slate-900 font-medium truncate max-w-xs">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900 truncate max-w-xs">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    );
  }

  const pathnames = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
      <Link to="/seller/dashboard" className="hover:text-slate-800 flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
      </Link>

      {pathnames.map((segment, index) => {
        if (segment === 'seller') return null;
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const label = ROUTE_NAME_MAP[segment] || (segment.startsWith('prod_') ? 'Product Details' : segment.startsWith('ord_') ? 'Order Details' : segment.startsWith('quot_') ? 'Quotation' : segment);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 capitalize truncate max-w-[180px]">
                {label}
              </span>
            ) : (
              <Link to={routeTo} className="hover:text-slate-900 font-medium capitalize">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
