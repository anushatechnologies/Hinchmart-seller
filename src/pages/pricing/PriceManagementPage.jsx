import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Edit2, Download, Search, Sliders, TrendingUp, Layers } from 'lucide-react';
import { usePricing } from '../../hooks/usePricing';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { QuickPriceModal } from '../../components/products/QuickPriceModal';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';

export function PriceManagementPage() {
  const { pricingList, isLoading, updateProductPrice } = usePricing();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filtered = pricingList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const rows = pricingList.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      Unit: p.unit,
      MRP: p.mrp,
      SellingPrice: p.sellingPrice,
      WholesalePrice: p.wholesalePrice || p.sellingPrice,
      DealerPrice: p.dealerPrice || p.sellingPrice,
      MarginPct: `${p.marginPercent}%`,
      GSTRate: `${p.gstRate}%`,
    }));
    exportToCsv('HinchMart_Price_List_2026', rows);
  };

  const columns = [
    {
      header: 'Material & SKU',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] font-mono text-slate-500">
            SKU: {row.sku} • {row.brand}
          </span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: ({ row }) => (
        <span className="text-xs capitalize">{row.category.replace('-', ' ')}</span>
      ),
    },
    {
      header: 'MRP',
      accessorKey: 'mrp',
      sortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-slate-400 line-through">
          {formatCurrency(row.mrp)}
        </span>
      ),
    },
    {
      header: 'B2B Selling Price',
      accessorKey: 'sellingPrice',
      sortable: true,
      cell: ({ row }) => (
        <span className="text-xs font-extrabold text-slate-900">
          {formatCurrency(row.sellingPrice)}{' '}
          <span className="text-[10px] font-normal text-slate-500">/ {row.unit}</span>
        </span>
      ),
    },
    {
      header: 'Wholesale / Dealer',
      cell: ({ row }) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">
            WS: {row.wholesalePrice ? formatCurrency(row.wholesalePrice) : '—'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            DLR: {row.dealerPrice ? formatCurrency(row.dealerPrice) : '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Volume Tiers',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {row.pricingTiers?.length || 0} Tiers Active
        </span>
      ),
    },
    {
      header: 'GST Rate',
      accessorKey: 'gstRate',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-emerald-600">+{row.gstRate}%</span>
      ),
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedProduct(row)}
          leftIcon={Edit2}
        >
          Edit Rate
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Price & Rate Master Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure baseline selling rates, volume discounts, dealer quotas, and tax calculations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
            Export Price List
          </Button>

          <Link to="/seller/pricing/bulk">
            <Button variant="primary" size="sm" leftIcon={Tag}>
              Bulk Price Adjustment Tool
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="w-full max-w-md">
          <Input
            placeholder="Search price list by material title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            LeftIcon={Search}
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        keyField="id"
      />

      {selectedProduct && (
        <QuickPriceModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onSave={async (id, data) => {
            await updateProductPrice({ id, priceData: data });
          }}
        />
      )}
    </div>
  );
}
