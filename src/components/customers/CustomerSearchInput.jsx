import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Building,
  User,
  MapPin,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  Phone,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCustomerSearch } from '../../hooks/useCustomers';
import { StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';

export function CustomerSearchInput({ selectedCustomer, onSelectCustomer, onClearCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { results, isLoading } = useCustomerSearch(searchTerm);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (customer) => {
    if (customer.status !== 'Active') {
      // Still select or trigger warning handled by parent
      onSelectCustomer(customer);
    } else {
      onSelectCustomer(customer);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  // If a customer is already selected, display the compact verified customer card
  if (selectedCustomer) {
    const isInactive = selectedCustomer.status !== 'Active';

    return (
      <div className="space-y-3">
        <div
          className={`p-4 rounded-xl border transition-all ${
            isInactive
              ? 'bg-rose-50/70 border-rose-300'
              : 'bg-amber-50/50 border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                SELECTED CLIENT / RECIPIENT
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight mt-0.5">
                {selectedCustomer.companyName}
              </h3>
              <p className="text-xs font-semibold text-slate-700">
                Attn: {selectedCustomer.name}{' '}
                <span className="text-[11px] font-mono text-slate-500 font-normal">
                  ({selectedCustomer.id})
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge status={selectedCustomer.status} />
              <button
                type="button"
                onClick={onClearCustomer}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 underline flex items-center gap-1 mt-1"
              >
                Change Customer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 text-xs text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                GSTIN / Tax ID
              </span>
              <span className="font-mono font-bold text-slate-900">
                {selectedCustomer.gstin || 'Not Provided'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Contact Phone
              </span>
              <span className="font-mono text-slate-800">{selectedCustomer.mobile}</span>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Site Delivery Destination
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {selectedCustomer.deliveryAddress}
              </p>
            </div>
          </div>

          {isInactive && (
            <div className="mt-3 p-2.5 bg-rose-100/80 border border-rose-300 rounded-lg flex items-center gap-2 text-xs text-rose-900 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                This customer is currently marked as {selectedCustomer.status}. Product labels cannot be generated for inactive clients.
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
        Recipient Customer / Consignee <span className="text-rose-500">*</span>
      </label>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-xs"
          placeholder="Search customer by name, company, mobile, GSTIN or Customer ID..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      <p className="text-[11px] text-slate-500">
        Customer credentials are authorized and managed through the Admin Customer Master database.
      </p>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
          {isLoading ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              Searching authorized customers...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              No matching customers found. Please verify the name or check with the Admin to enroll the client.
            </div>
          ) : (
            results.map((c) => {
              const isInactive = c.status !== 'Active';

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isInactive
                      ? 'bg-slate-50/80 hover:bg-rose-50/50 opacity-75'
                      : 'hover:bg-amber-50/60'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {c.companyName}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>ID: {c.id}</span>
                      <span>•</span>
                      <span>Attn: {c.name}</span>
                      <span>•</span>
                      <span>{c.city}, {c.state}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 truncate">
                      GSTIN: <strong className="font-mono text-slate-800">{c.gstin || '—'}</strong> • Phone: {c.mobile}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant={isInactive ? 'secondary' : 'primary'}
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(c);
                    }}
                  >
                    Select
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
