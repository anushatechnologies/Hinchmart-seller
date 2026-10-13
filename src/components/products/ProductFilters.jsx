import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Tag,
  ArrowDownUp,
  Layers,
  Building,
  Filter,
} from 'lucide-react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';

export function ProductFilters({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  categories = [],
  stockStatus,
  onStockStatusChange,
  brand,
  onBrandChange,
  brands = [],
  sortBy,
  onSortByChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  onClearFilters,
  hasActiveFilters,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      {/* Primary Row: Search + Quick Category + Stock + View Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Search by product name, SKU, Product ID, HSN, or brand..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            LeftIcon={Search}
          />
        </div>

        {/* Quick Dropdowns */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="col-span-2 sm:w-44">
            <Select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              options={[
                { value: 'All', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          {/* Stock Status Dropdown */}
          <div className="col-span-1 sm:w-36">
            <Select
              value={stockStatus}
              onChange={(e) => onStockStatusChange(e.target.value)}
              options={[
                { value: 'All', label: 'All Stock' },
                { value: 'inStock', label: 'In Stock' },
                { value: 'lowStock', label: 'Low Stock' },
                { value: 'outOfStock', label: 'Out of Stock' },
              ]}
            />
          </div>

          {/* Sort Dropdown */}
          <div className="col-span-1 sm:w-36">
            <Select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              options={[
                { value: 'newest', label: 'Sort: Newest' },
                { value: 'oldest', label: 'Sort: Oldest' },
                { value: 'nameAsc', label: 'Name: A → Z' },
                { value: 'nameDesc', label: 'Name: Z → A' },
                { value: 'priceAsc', label: 'Price: Low → High' },
                { value: 'priceDesc', label: 'Price: High → Low' },
                { value: 'stockAsc', label: 'Stock: Low → High' },
                { value: 'stockDesc', label: 'Stock: High → Low' },
                { value: 'mostSold', label: 'Most Sold' },
              ]}
            />
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            type="button"
            variant={showAdvanced ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={SlidersHorizontal}
          >
            Filters
          </Button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClearFilters}
              leftIcon={RotateCcw}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Panel (Brand & Price Range) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
          {/* Brand Filter */}
          <Select
            label="Filter by Brand"
            value={brand}
            onChange={(e) => onBrandChange(e.target.value)}
            options={[
              { value: 'All', label: 'All Brands' },
              ...brands.map((b) => ({ value: b, label: b })),
            ]}
          />

          {/* Min Price */}
          <Input
            label="Min Price (₹)"
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
          />

          {/* Max Price */}
          <Input
            label="Max Price (₹)"
            type="number"
            placeholder="1,000,000"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
          />

          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={onClearFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
