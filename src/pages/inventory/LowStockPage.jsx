import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw, Boxes, Plus } from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { QuickStockModal } from '../../components/products/QuickPriceModal';
import { formatNumber } from '../../utils/formatters';

export function LowStockPage() {
  const { inventory, isLoadingInventory, updateStock } = useInventory();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const lowStockItems = inventory.filter((i) => i.isLowStock || i.isOutOfStock);

  const columns = [
    {
      header: 'Critical Low Stock Material',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <span className="text-xs font-bold text-slate-900 block">{row.name}</span>
          <span className="text-[11px] font-mono text-slate-500">
            SKU: {row.sku} • {row.warehouseName}
          </span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      accessorKey: 'availableStock',
      cell: ({ row }) => (
        <span
          className={`text-xs font-black ${
            row.availableStock === 0 ? 'text-rose-600' : 'text-amber-600'
          }`}
        >
          {formatNumber(row.availableStock)} {row.unit}
        </span>
      ),
    },
    {
      header: 'Reorder Threshold',
      accessorKey: 'lowStockThreshold',
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-700">
          {formatNumber(row.lowStockThreshold)} {row.unit}
        </span>
      ),
    },
    {
      header: 'Deficit / Shortfall',
      cell: ({ row }) => {
        const deficit = Math.max(0, row.lowStockThreshold - row.availableStock);
        return (
          <span className="text-xs font-bold text-rose-600">
            -{formatNumber(deficit)} {row.unit} Short
          </span>
        );
      },
    },
    {
      header: 'Action',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            setSelectedProduct({
              id: row.id,
              name: row.name,
              sku: row.sku,
              stock: row.availableStock,
              unit: row.unit,
            })
          }
          leftIcon={Plus}
        >
          Record Inbound Lot
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/inventory">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Stock Master
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Critical Low Stock & Out-of-Stock Alerts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {lowStockItems.length} Warnings Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Materials below safety minimum reorder thresholds requiring supplier batch PO
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={lowStockItems}
        isLoading={isLoadingInventory}
        keyField="id"
        emptyState={
          <div className="text-center py-12 text-xs text-slate-500">
            Great news! All material stocks are currently above minimum threshold.
          </div>
        }
      />

      {selectedProduct && (
        <QuickStockModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          onSave={async (id, data) => {
            await updateStock({ productId: id, adjustment: data });
          }}
        />
      )}
    </div>
  );
}
