import React, { useState } from 'react';
import { useCategorySchema } from '../../hooks/useCategories';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Plus, Trash2, Sliders } from 'lucide-react';

export function DynamicSpecRenderer({ categoryId, values = {}, onChange }) {
  const { specFields = [], isLoading } = useCategorySchema(categoryId);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 animate-pulse">
        Loading category specifications...
      </div>
    );
  }

  // Predefined schema field names
  const schemaFieldNames = new Set(specFields.map((f) => f.name));

  // Custom specifications present in values that aren't part of predefined category schema
  const customSpecEntries = Object.entries(values || {}).filter(
    ([key]) => !schemaFieldNames.has(key)
  );

  const handleAddCustomSpec = (e) => {
    e?.preventDefault();
    if (newKey.trim()) {
      onChange(newKey.trim(), newVal.trim());
      setNewKey('');
      setNewVal('');
    }
  };

  const handleRemoveCustomSpec = (keyToRemove) => {
    // Pass undefined or null so caller or object spreads can remove it
    onChange(keyToRemove, undefined);
  };

  return (
    <div className="space-y-5">
      {/* 1. Category Schema Defined Fields (if any) */}
      {specFields.length > 0 && (
        <div className="space-y-3">
          <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200/60 text-xs text-amber-900 font-semibold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>Category Schema Parameters ({specFields.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specFields.map((field) => {
              const val = values[field.name] || '';

              if (field.type === 'select') {
                return (
                  <Select
                    key={field.name}
                    label={field.label}
                    options={field.options || []}
                    value={val}
                    placeholder={`Select ${field.label}`}
                    required={field.required}
                    onChange={(e) => onChange(field.name, e.target.value)}
                  />
                );
              }

              return (
                <Input
                  key={field.name}
                  label={field.label}
                  type={field.type || 'text'}
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  value={val}
                  required={field.required}
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Custom Product Technical Specifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800">
            Technical Specification Properties ({customSpecEntries.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Engineering & Trade Attributes
          </span>
        </div>

        {customSpecEntries.length === 0 ? (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
            No custom specifications configured yet. Add attributes like Grade, Packaging, Standard, or Dimensions below.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customSpecEntries.map(([key, val]) => (
              <div
                key={key}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider truncate max-w-[150px]">
                    {key}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomSpec(key)}
                    className="p-1 text-slate-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove specification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={val !== undefined && val !== null ? String(val) : ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  placeholder={`Value for ${key}`}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            ))}
          </div>
        )}

        {/* Add New Specification Inline Row */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 block">
            Add New Specification Attribute
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              placeholder="Attribute Key (e.g. Grade, Standard, Packaging)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full sm:flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
            <input
              type="text"
              placeholder="Value (e.g. PPC Grade, IS 1489)"
              value={newVal}
              onChange={(e) => setNewVal(e.target.value)}
              className="w-full sm:flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleAddCustomSpec}
              disabled={!newKey.trim()}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DynamicSpecRenderer;
