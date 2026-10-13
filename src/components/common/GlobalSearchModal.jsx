import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  ShoppingCart,
  HelpCircle,
  FileText,
  Users,
  Receipt,
  ArrowRight,
  X,
  Mic,
  MicOff,
  Loader2,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../mock/db';
import { formatCurrency, formatDate } from '../../utils/formatters';

import { searchSellerData } from '../../utils/searchEngine';

export function GlobalSearchModal() {
  const { globalSearchOpen, setGlobalSearchOpen, addToast } = useUIStore();
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  // Keyboard shortcut listener Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const handleToggleVoiceSearch = () => {
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
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
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

  if (!globalSearchOpen) return null;

  const searchResults = searchSellerData(query, db) || {
    orders: [],
    invoices: [],
    customers: [],
    products: [],
    quotations: [],
    totalCount: 0,
  };

  const matchingCustomers = searchResults.customers;
  const matchingProducts = searchResults.products;
  const matchingOrders = searchResults.orders;
  const matchingInvoices = searchResults.invoices;
  const matchingQuotations = searchResults.quotations;
  const matchingEnquiries = [];

  const handleSelect = (url) => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setGlobalSearchOpen(false);
    setQuery('');
    navigate(url);
  };

  const hasResults = searchResults.totalCount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
          }
          setGlobalSearchOpen(false);
        }}
      />

      <div className="relative mx-auto max-w-2xl transform divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, customers, products, invoices..."
            className="h-14 w-full border-0 bg-transparent pl-3 pr-16 text-slate-900 placeholder:text-slate-400 focus:outline-none text-sm sm:text-base font-medium"
            autoFocus
          />

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Voice Search Button */}
            <button
              type="button"
              onClick={handleToggleVoiceSearch}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Voice Search'}
              aria-label={isListening ? 'Listening for speech' : 'Start voice search'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
                ESC
              </kbd>
            )}
          </div>
        </div>

        {/* Voice Listening Active Indicator */}
        {isListening && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Listening... Speak product, order number, customer, or invoice</span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoiceSearch}
              className="text-rose-600 font-bold hover:underline"
            >
              Stop
            </button>
          </div>
        )}

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-100">
          {!query && !isListening && (
            <div className="p-6 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700 mb-1">Quick Operational Shortcuts</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <button
                  onClick={() => handleSelect('/seller/products/add')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  + Add Product
                </button>
                <button
                  onClick={() => handleSelect('/seller/customers')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  + Add Customer
                </button>
                <button
                  onClick={() => handleSelect('/seller/quotations/create')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  + Create Quotation
                </button>
                <button
                  onClick={() => handleSelect('/seller/products/bulk-upload')}
                  className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                >
                  Bulk Upload Products
                </button>
              </div>
            </div>
          )}

          {query && !hasResults && (
            <div className="p-8 text-center text-xs text-slate-500">
              No matching records found for "{query}". Try searching by order number, customer name, SKU, or invoice ID.
            </div>
          )}

          {/* Customers */}
          {matchingCustomers.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" /> Customers ({matchingCustomers.length})
              </div>
              {matchingCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(`/seller/customers/${c.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                      {c.companyName}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {c.id} • Attn: {c.name} • {c.city || 'India'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Invoices */}
          {matchingInvoices.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Invoices ({matchingInvoices.length})
              </div>
              {matchingInvoices.map((o) => (
                <div
                  key={o.id}
                  onClick={() => handleSelect(`/seller/orders/${o.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 font-mono group-hover:text-emerald-700">
                      {o.invoice?.invoiceNumber || `INV-${o.orderNumber.replace('ORD-', '')}`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Order: {o.orderNumber} • Billed to: {o.buyer?.company}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(o.totalAmount)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold block">
                      Tax Invoice
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products */}
          {matchingProducts.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" /> Products ({matchingProducts.length})
              </div>
              {matchingProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(`/seller/products/${p.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.images?.[0]}
                      alt={p.name}
                      className="w-9 h-9 rounded object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700">
                        {p.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        SKU: {p.sku} • {p.brand}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(p.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">per {p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders */}
          {matchingOrders.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-500" /> Orders ({matchingOrders.length})
              </div>
              {matchingOrders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => handleSelect(`/seller/orders/${o.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 font-mono group-hover:text-amber-600">
                      {o.orderNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">{o.buyer?.company}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {formatCurrency(o.totalAmount)}
                    </span>
                    <span className="text-[10px] font-medium text-amber-600 block">
                      {o.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quotations */}
          {matchingQuotations.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500" /> Quotations ({matchingQuotations.length})
              </div>
              {matchingQuotations.map((qItem) => (
                <div
                  key={qItem.id}
                  onClick={() => handleSelect(`/seller/quotations/${qItem.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 font-mono group-hover:text-amber-600">
                      {qItem.quotationNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">{qItem.buyer?.company}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {formatCurrency(qItem.grandTotal)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Enquiries */}
          {matchingEnquiries.length > 0 && (
            <div className="py-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> Buyer Enquiries ({matchingEnquiries.length})
              </div>
              {matchingEnquiries.map((e) => (
                <div
                  key={e.id}
                  onClick={() => handleSelect('/seller/enquiries')}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-600">
                      {e.productName}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {e.buyerName} ({e.company})
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    {e.quantityRequired}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-slate-400" /> Click mic icon for voice search
          </span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}

