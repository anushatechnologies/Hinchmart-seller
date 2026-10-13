import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Mic,
  MicOff,
  X,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  FileText,
  Truck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Tag,
  Building2,
} from 'lucide-react';
import { db } from '../../mock/db';
import { useUIStore } from '../../store/uiStore';
import { useProductSearchSuggestions } from '../../hooks/useProducts';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { StatusBadge } from '../common/Badge';
import { searchSellerData } from '../../utils/searchEngine';

export function HeaderSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useUIStore((state) => state.addToast);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Handle outside click & Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Voice Search Handler
  const handleToggleVoice = (e) => {
    e.stopPropagation();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({
        title: 'Voice Search',
        message: 'Voice search is not supported in this browser.',
        type: 'warning',
      });
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setIsOpen(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        setIsOpen(true);
        addToast({
          title: 'Voice Detected',
          message: `Searching for "${transcript}"`,
          type: 'info',
        });
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          addToast({
            title: 'Microphone Access Denied',
            message: 'Please allow microphone access in your browser to use voice search.',
            type: 'error',
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      console.warn('Speech recognition error:', err);
    }
  };

  const { suggestions = [] } = useProductSearchSuggestions(query);

  // Perform Live Prefix & Suffix / Contains Search Across Modules
  const results = useMemo(() => {
    return searchSellerData(query, db);
  }, [query]);

  const handleSelectResult = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path, { state: { from: location } });
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSelectResult(`/seller/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-xl lg:max-w-2xl">
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleSearchSubmit}
          placeholder="Search orders, customers, products, invoices..."
          className="w-full h-10 pl-11 pr-20 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg shadow-2xs hover:border-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Voice Search Microphone Trigger */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/80'
            }`}
            title={isListening ? 'Listening... click to stop' : 'Voice Search'}
            aria-label="Voice Search"
          >
            {isListening ? (
              <Mic className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Voice Listening Active Notification Banner */}
      {isListening && (
        <div className="absolute top-12 left-0 right-0 z-50 p-2.5 bg-rose-50 border border-rose-200 rounded-xl shadow-lg flex items-center justify-between text-xs text-rose-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>Listening... Speak order number, company name or product</span>
          </div>
          <button
            type="button"
            onClick={handleToggleVoice}
            className="text-[11px] font-extrabold text-rose-700 hover:underline px-1"
          >
            Stop
          </button>
        </div>
      )}

      {/* Live Dropdown Search Results Panel */}
      {isOpen && query.trim() && !isListening && (
        <div className="absolute top-12 left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[75vh] overflow-y-auto custom-scrollbar divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
          {/* Autocomplete Brand & Product Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 bg-emerald-50/50">
              <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Live Suggestions ({suggestions.length})
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Hierarchy Match</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((s, idx) => (
                  <div
                    key={`sugg-${s.type}-${s.id || idx}`}
                    onClick={() => handleSelectResult(s.link || (s.type === 'BRAND' ? `/seller/products?brand=${encodeURIComponent(s.title)}` : `/seller/products/${s.id}`))}
                    className="p-2.5 rounded-xl hover:bg-white flex items-center justify-between cursor-pointer transition-colors border border-transparent hover:border-emerald-200 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        s.type === 'BRAND'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {s.type}
                      </span>
                      <div>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {s.title}
                        </p>
                        {s.subtitle && (
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {s.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && results.totalCount > 0 ? (
            <>
              {/* 1. Orders Group */}
              {results.orders.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                      Orders ({results.orders.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectResult('/seller/orders')}
                      className="text-amber-600 hover:underline font-bold text-[10.5px]"
                    >
                      View all orders →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleSelectResult(`/seller/orders/${order.id}`)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                              {order.orderNumber}
                            </span>
                            <StatusBadge status={order.orderStatus} />
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {order.buyer?.company || order.buyer?.name} • {order.items?.[0]?.name}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-slate-900 block">
                            {formatCurrency(order.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Invoices Group */}
              {results.invoices.length > 0 && (
                <div className="p-3">
                  <div className="px-2 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                    Commercial Invoices ({results.invoices.length})
                  </div>
                  <div className="space-y-1">
                    {results.invoices.map((inv, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectResult(`/seller/orders/${inv.orderId}`)}
                        className="p-2.5 rounded-xl hover:bg-emerald-50/40 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-700 group-hover:text-emerald-800">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                              Tax Invoice
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            Billed to {inv.buyerCompany} • Order {inv.orderNumber}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-slate-900 block">
                            {formatCurrency(inv.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(inv.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Customers Group */}
              {results.customers.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      Customers ({results.customers.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectResult('/seller/customers')}
                      className="text-purple-600 hover:underline font-bold text-[10.5px]"
                    >
                      Directory →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectResult(`/seller/customers/${cust.id}`)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                            {cust.company || cust.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {cust.name} • {cust.city || 'India'} • +91 {cust.phone || '98XXXXXXXX'}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-purple-600 hover:underline shrink-0">
                          Profile →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Products Group */}
              {results.products.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      Catalog Products ({results.products.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectResult('/seller/products')}
                      className="text-amber-600 hover:underline font-bold text-[10.5px]"
                    >
                      Full Catalog →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.products.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectResult(`/seller/products/${prod.id}`)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                            SKU: {prod.sku || prod.id} • {prod.category}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-slate-900 block">
                            {formatCurrency(prod.basePrice || prod.price || 0)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Stock: {prod.stock || 0} {prod.unit || 'units'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Quotations & RFQs */}
              {results.quotations.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between px-2 pb-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      Quotations & RFQs ({results.quotations.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectResult('/seller/quotations')}
                      className="text-indigo-600 hover:underline font-bold text-[10.5px]"
                    >
                      All Quotations →
                    </button>
                  </div>
                  <div className="space-y-1">
                    {results.quotations.map((qt) => (
                      <div
                        key={qt.id}
                        onClick={() => handleSelectResult(`/seller/quotations/${qt.id}`)}
                        className="p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {qt.quotationNumber}
                            </span>
                            <StatusBadge status={qt.status} />
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            Buyer: {qt.buyer?.company || qt.buyer?.name}
                          </p>
                        </div>
                        <span className="font-extrabold text-xs text-slate-900 shrink-0">
                          {formatCurrency(qt.grandTotal || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No Results Found State */
            <div className="p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No results found for "{query}"</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try searching by order number, customer, product or invoice.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
