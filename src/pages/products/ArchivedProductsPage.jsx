import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, RotateCcw, Trash2, ArrowLeft, Eye } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { formatCurrency } from '../../utils/formatters';

export function ArchivedProductsPage() {
  const { products, restoreProduct, deleteProduct, isLoading } = useProducts({
    status: 'Archived',
  });

  const [deleteProductItem, setDeleteProductItem] = useState(null);

  const columns = [
    {
      header: 'Archived Product',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0]}
            alt={row.name}
            className="w-10 h-10 rounded object-cover border border-slate-200"
          />
          <div>
            <span className="text-xs font-bold text-slate-900 block">{row.name}</span>
            <span className="text-[11px] font-mono text-slate-500">SKU: {row.sku}</span>
          </div>
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
      header: 'Price',
      accessorKey: 'sellingPrice',
      cell: ({ row }) => (
        <span className="text-xs font-bold">{formatCurrency(row.sellingPrice)}</span>
      ),
    },
    {
      header: 'Actions',
      cellClassName: 'text-right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => restoreProduct(row.id)}
            leftIcon={RotateCcw}
          >
            Restore to Live
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteProductItem(row)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/products">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Active Products
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Archived Products</h1>
            <p className="text-xs text-slate-500">
              Materials removed from public marketplace. You can restore them anytime.
            </p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-12 text-xs text-slate-500">
            No archived products. All catalog materials are active or in drafts.
          </div>
        }
      />

      {deleteProductItem && (
        <ConfirmationDialog
          isOpen={Boolean(deleteProductItem)}
          onClose={() => setDeleteProductItem(null)}
          onConfirm={async () => {
            await deleteProduct(deleteProductItem.id);
            setDeleteProductItem(null);
          }}
          title="Delete Product Permanently"
          message={`Are you sure you want to permanently delete "${deleteProductItem.name}"?`}
          confirmText="Yes, Delete Permanently"
          variant="danger"
        />
      )}
    </div>
  );
}
