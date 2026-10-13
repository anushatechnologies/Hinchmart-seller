import React from 'react';
import { useCategorySchema } from '../../hooks/useCategories';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

export function DynamicSpecRenderer({ categoryId, values = {}, onChange }) {
  const { specFields, isLoading } = useCategorySchema(categoryId);

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 animate-pulse">
        Loading category specifications...
      </div>
    );
  }

  if (!specFields || specFields.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
        No specific technical parameter schema required for this category. You may specify custom notes in the product description.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs text-amber-900 font-medium">
        Category-Specific Technical Specifications ({specFields.length} attributes available)
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
  );
}
