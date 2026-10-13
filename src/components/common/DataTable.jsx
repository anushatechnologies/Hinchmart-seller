import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyState,
  pagination,
  onRowClick,
  selectedRowIds = [],
  onSelectRow,
  onSelectAll,
  renderMobileCard,
  sortBy,
  sortDirection = 'asc',
  onSort,
  className,
}) {
  const allSelected = data.length > 0 && data.every(row => selectedRowIds.includes(row[keyField]));
  const someSelected = selectedRowIds.length > 0 && !allSelected;

  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden', className)}>
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              {onSelectAll && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                  />
                </th>
              )}

              {columns.map((col) => {
                const canSort = Boolean(col.sortable && onSort);
                const isCurrentSort = sortBy === col.accessorKey;

                return (
                  <th
                    key={col.header || col.accessorKey}
                    className={cn(
                      'px-4 py-3 font-bold text-slate-600',
                      col.headerClassName,
                      canSort && 'cursor-pointer hover:text-slate-900 transition-colors'
                    )}
                    onClick={() => canSort && onSort(col.accessorKey)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-slate-400">
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="p-0">
                  <TableSkeleton rows={6} cols={columns.length} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-12 px-4">
                  {emptyState || <EmptyState />}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isSelected = selectedRowIds.includes(row[keyField]);
                return (
                  <tr
                    key={row[keyField] || rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'transition-colors hover:bg-slate-50/80 row-hover-accent',
                      isSelected && 'bg-amber-50/40',
                      !isSelected && rowIndex % 2 === 1 && 'bg-slate-25',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {onSelectRow && (
                      <td
                        className="w-10 px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow(row[keyField], e.target.checked)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4"
                        />
                      </td>
                    )}

                    {columns.map((col, colIndex) => {
                      const value = col.accessorKey ? row[col.accessorKey] : null;
                      return (
                        <td
                          key={colIndex}
                          className={cn('px-4 py-3.5 align-middle', col.cellClassName)}
                        >
                          {col.cell ? col.cell({ row, value, index: rowIndex }) : value}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List Transformation */}
      <div className="block md:hidden divide-y divide-slate-200">
        {isLoading ? (
          <TableSkeleton rows={4} cols={2} />
        ) : data.length === 0 ? (
          <div className="p-6">{emptyState || <EmptyState />}</div>
        ) : (
          data.map((row, index) => {
            if (renderMobileCard) {
              return (
                <div key={row[keyField] || index} className="p-4">
                  {renderMobileCard({ row, index })}
                </div>
              );
            }

            // Fallback mobile card renderer
            return (
              <div
                key={row[keyField] || index}
                onClick={() => onRowClick && onRowClick(row)}
                className="p-4 space-y-2 hover:bg-slate-50 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <div key={colIndex} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">{col.header}:</span>
                    <span className="text-slate-800 text-right">
                      {col.cell
                        ? col.cell({ row, value: row[col.accessorKey], index })
                        : row[col.accessorKey]}
                    </span>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
