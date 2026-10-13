import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  MapPin,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useQuotations, useQuotation } from '../../hooks/useQuotations';
import { useCustomers } from '../../hooks/useCustomers';
import { useEnquiries } from '../../hooks/useEnquiries';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useUIStore } from '../../store/uiStore';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export function CreateQuotationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const addToast = useUIStore((state) => state.addToast);

  // Check URL query parameters or location state
  const enquiryIdParam = searchParams.get('enquiryId');
  const editIdParam = searchParams.get('editId') || searchParams.get('id');

  const enquiryFromState = location.state?.enquiry;
  const customerFromState = location.state?.customer;
  const quotationFromState = location.state?.quotation;

  const { products = [], isLoading: isLoadingProducts } = useProducts();
  const { customers = [], isLoading: isLoadingCustomers } = useCustomers();
  const { enquiries = [] } = useEnquiries();
  const { createQuotation, updateQuotation } = useQuotations();
  const { quotation: fetchedQuotation, isLoading: isLoadingQuotation } = useQuotation(editIdParam);
  const { profile } = useSellerProfile();

  // Determine active quotation being edited if in edit mode
  const activeQuotation = quotationFromState || fetchedQuotation;

  // Determine active enquiry
  const activeEnquiry = useMemo(() => {
    if (enquiryFromState) return enquiryFromState;
    if (enquiryIdParam) {
      return enquiries.find(
        (e) => String(e.id) === String(enquiryIdParam) || String(e.enquiryId) === String(enquiryIdParam)
      );
    }
    return null;
  }, [enquiryFromState, enquiryIdParam, enquiries]);

  // Dynamic default validity date: 15 days ahead from today
  const getDefaultValidityDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [buyer, setBuyer] = useState({
    company: '',
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
  });

  const [validUntil, setValidUntil] = useState(getDefaultValidityDate);
  const [freightCharges, setFreightCharges] = useState(0);

  const [paymentTerms, setPaymentTerms] = useState(
    '50% Advance with Purchase Order, balance 50% against Delivery Challan or Escrow Secured.'
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    'Door delivery at buyer project site within standard fulfillment window upon purchase order confirmation.'
  );

  const [items, setItems] = useState([
    {
      productId: '',
      name: '',
      sku: '',
      quantity: 1,
      unit: 'Unit',
      unitPrice: 0,
      discountPercent: 0,
      gstRate: 18,
    },
  ]);

  const [errors, setErrors] = useState({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Sync state if editing an existing quotation
  useEffect(() => {
    if (activeQuotation) {
      if (activeQuotation.buyer) {
        setBuyer({
          company: activeQuotation.buyer.company || '',
          name: activeQuotation.buyer.name || '',
          phone: activeQuotation.buyer.phone || '',
          email: activeQuotation.buyer.email || '',
          gstin: activeQuotation.buyer.gstin || '',
          address: activeQuotation.buyer.address || '',
        });
      }
      if (activeQuotation.customerId) setSelectedCustomerId(activeQuotation.customerId);
      if (activeQuotation.validUntil) {
        setValidUntil(activeQuotation.validUntil.split('T')[0]);
      }
      if (activeQuotation.freightCharges !== undefined) {
        setFreightCharges(Number(activeQuotation.freightCharges) || 0);
      }
      if (activeQuotation.paymentTerms) setPaymentTerms(activeQuotation.paymentTerms);
      if (activeQuotation.deliveryTerms) setDeliveryTerms(activeQuotation.deliveryTerms);
      if (Array.isArray(activeQuotation.items) && activeQuotation.items.length > 0) {
        setItems(
          activeQuotation.items.map((item) => ({
            productId: item.productId || '',
            name: item.name || item.productTitle || '',
            sku: item.sku || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'Unit',
            unitPrice: item.unitPrice || item.price || 0,
            discountPercent: item.discountPercent || 0,
            gstRate: item.gstRate || 18,
          }))
        );
      }
    }
  }, [activeQuotation]);

  // Sync state if customer passed via router state
  useEffect(() => {
    if (customerFromState && !activeQuotation) {
      setSelectedCustomerId(customerFromState.id || '');
      setBuyer({
        company: customerFromState.companyName || '',
        name: customerFromState.name || '',
        phone: customerFromState.mobile || customerFromState.phone || '',
        email: customerFromState.email || '',
        gstin: customerFromState.gstin || '',
        address:
          customerFromState.deliveryAddress ||
          customerFromState.billingAddress ||
          `${customerFromState.city || ''}, ${customerFromState.state || ''}`,
      });
    }
  }, [customerFromState, activeQuotation]);

  // Sync state if opened from an enquiry
  useEffect(() => {
    if (activeEnquiry && !activeQuotation && !customerFromState) {
      setBuyer((prev) => ({
        company: activeEnquiry.company || prev.company,
        name: activeEnquiry.buyerName || prev.name,
        phone: activeEnquiry.phone || prev.phone,
        email: activeEnquiry.email || prev.email,
        gstin: activeEnquiry.gstin || prev.gstin || '',
        address: activeEnquiry.deliveryLocation || prev.address,
      }));
    }
  }, [activeEnquiry, activeQuotation, customerFromState]);

  // Dynamically initialize product line with catalogue items or enquiry requested product
  useEffect(() => {
    if (
      products.length > 0 &&
      items.length === 1 &&
      !items[0].productId &&
      !activeQuotation
    ) {
      if (activeEnquiry?.productName) {
        const queryTerm = activeEnquiry.productName.toLowerCase();
        const matched = products.find(
          (p) =>
            (p.name && p.name.toLowerCase().includes(queryTerm)) ||
            queryTerm.includes((p.name || '').toLowerCase())
        );

        if (matched) {
          const qtyMatch = String(activeEnquiry.quantityRequired || '')
            .replace(/,/g, '')
            .match(/\d+(\.\d+)?/);
          const priceMatch = String(activeEnquiry.targetPrice || '')
            .replace(/,/g, '')
            .match(/\d+(\.\d+)?/);

          setItems([
            {
              productId: matched.id,
              name: matched.name || matched.title,
              sku: matched.sku || '',
              quantity: qtyMatch ? Number(qtyMatch[0]) : 1,
              unit: matched.unit || 'Unit',
              unitPrice: priceMatch
                ? Number(priceMatch[0])
                : matched.sellingPrice || matched.price || 0,
              discountPercent: 0,
              gstRate: matched.gstRate ?? matched.gst ?? 18,
            },
          ]);
          return;
        }
      }

      // Default to first product in seller catalogue
      const firstProd = products[0];
      setItems([
        {
          productId: firstProd.id,
          name: firstProd.name || firstProd.title,
          sku: firstProd.sku || '',
          quantity: 1,
          unit: firstProd.unit || 'Unit',
          unitPrice: firstProd.sellingPrice || firstProd.price || 0,
          discountPercent: 0,
          gstRate: firstProd.gstRate ?? firstProd.gst ?? 18,
        },
      ]);
    }
  }, [products, activeEnquiry, activeQuotation]);

  // Customer CRM selection handler
  const handleSelectCustomer = (custId) => {
    setSelectedCustomerId(custId);
    if (!custId) return;

    const found = customers.find((c) => c.id === custId);
    if (found) {
      setBuyer({
        company: found.companyName || '',
        name: found.name || '',
        phone: found.mobile || found.phone || '',
        email: found.email || '',
        gstin: found.gstin || '',
        address:
          found.deliveryAddress ||
          found.billingAddress ||
          `${found.city || ''}, ${found.state || ''}`,
      });

      // Clear field errors
      setErrors((prev) => ({
        ...prev,
        company: undefined,
        name: undefined,
        phone: undefined,
        email: undefined,
        address: undefined,
      }));
    }
  };

  // Product line selection handler
  const handleProductSelect = (index, prodId) => {
    const selectedProd = products.find((p) => p.id === prodId);
    if (!selectedProd) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      name: selectedProd.name || selectedProd.title,
      sku: selectedProd.sku || '',
      unit: selectedProd.unit || 'Unit',
      unitPrice: selectedProd.sellingPrice || selectedProd.price || 0,
      gstRate: selectedProd.gstRate ?? selectedProd.gst ?? 18,
    };
    setItems(newItems);
  };

  // Product line field change handler
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    let parsedVal = value;

    if (field === 'quantity' || field === 'unitPrice' || field === 'discountPercent' || field === 'gstRate') {
      parsedVal = value === '' ? '' : Number(value);
    }

    newItems[index] = {
      ...newItems[index],
      [field]: parsedVal,
    };
    setItems(newItems);

    // Clear item errors
    if (errors.itemErrors?.[index]?.[field]) {
      const updatedItemErrors = [...(errors.itemErrors || [])];
      if (updatedItemErrors[index]) {
        delete updatedItemErrors[index][field];
      }
      setErrors((prev) => ({ ...prev, itemErrors: updatedItemErrors }));
    }
  };

  // Add new empty product line
  const handleAddItem = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProd?.id || '',
        name: firstProd?.name || firstProd?.title || '',
        sku: firstProd?.sku || '',
        quantity: 1,
        unit: firstProd?.unit || 'Unit',
        unitPrice: firstProd?.sellingPrice || firstProd?.price || 0,
        discountPercent: 0,
        gstRate: firstProd?.gstRate ?? firstProd?.gst ?? 18,
      },
    ]);
  };

  // Remove a product line (must have at least 1)
  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Line & Grand Total Calculations
  const calculatedItems = useMemo(() => {
    return items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discountPct = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
      const gstPct = Number(item.gstRate) || 0;

      const baseTotal = qty * price;
      const discountAmt = (baseTotal * discountPct) / 100;
      const netTaxable = baseTotal - discountAmt;
      const gstAmt = (netTaxable * gstPct) / 100;
      const total = netTaxable + gstAmt;

      return {
        ...item,
        quantity: qty,
        unitPrice: price,
        discountPercent: discountPct,
        gstRate: gstPct,
        baseTotal,
        discountAmt,
        netTaxable,
        gstAmt,
        total,
      };
    });
  }, [items]);

  const subtotal = useMemo(
    () => calculatedItems.reduce((acc, i) => acc + i.baseTotal, 0),
    [calculatedItems]
  );
  const discountTotal = useMemo(
    () => calculatedItems.reduce((acc, i) => acc + i.discountAmt, 0),
    [calculatedItems]
  );
  const netTaxableTotal = subtotal - discountTotal;
  const taxTotal = useMemo(
    () => calculatedItems.reduce((acc, i) => acc + i.gstAmt, 0),
    [calculatedItems]
  );
  const grandTotal = netTaxableTotal + taxTotal + Number(freightCharges || 0);

  // Form Validation
  const validateForm = (isDraft = false) => {
    const newErrors = {};

    if (!buyer.company?.trim()) {
      newErrors.company = 'Buyer Company Name is required';
    }

    if (!isDraft) {
      if (!buyer.name?.trim()) {
        newErrors.name = 'Contact Person Name is required';
      }
      if (!buyer.phone?.trim()) {
        newErrors.phone = 'Contact Phone is required';
      } else if (!/^[+0-9\s-]{8,18}$/.test(buyer.phone.trim())) {
        newErrors.phone = 'Enter a valid contact number';
      }
      if (!buyer.email?.trim()) {
        newErrors.email = 'Official Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) {
        newErrors.email = 'Enter a valid corporate email';
      }
      if (!validUntil) {
        newErrors.validUntil = 'Validity Expiry Date is required';
      } else {
        const d = new Date(validUntil);
        if (isNaN(d.getTime())) {
          newErrors.validUntil = 'Invalid date';
        }
      }
      if (!buyer.address?.trim()) {
        newErrors.address = 'Project Site Delivery Address is required';
      }

      // Check item fields
      if (items.length === 0) {
        newErrors.items = 'At least 1 product line is required';
      } else {
        const itemErrors = items.map((item) => {
          const err = {};
          if (!item.productId && !item.name) err.product = 'Select a material';
          if (!item.quantity || Number(item.quantity) <= 0) err.quantity = 'Must be > 0';
          if (item.unitPrice === undefined || item.unitPrice === null || Number(item.unitPrice) <= 0) {
            err.unitPrice = 'Must be > 0';
          }
          return Object.keys(err).length > 0 ? err : null;
        });

        if (itemErrors.some(Boolean)) {
          newErrors.itemErrors = itemErrors;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Back navigation preserving previous route context
  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (activeEnquiry) {
      navigate('/seller/enquiries');
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/seller/quotations');
    }
  };

  // Submit Handler (Save Draft or Send Quotation)
  const handleSubmit = async (targetStatus = 'Sent to Buyer') => {
    const isDraft = targetStatus === 'Draft';
    const isValid = validateForm(isDraft);

    if (!isValid) {
      addToast({
        title: 'Incomplete Proposal Form',
        message: 'Please resolve the highlighted fields before proceeding.',
        type: 'error',
      });
      return;
    }

    if (isDraft) {
      setIsSavingDraft(true);
    } else {
      setIsSending(true);
    }

    try {
      const quotationPayload = {
        buyer: {
          name: buyer.name.trim(),
          company: buyer.company.trim(),
          phone: buyer.phone.trim(),
          email: buyer.email.trim(),
          gstin: buyer.gstin.trim(),
          address: buyer.address.trim(),
        },
        items: calculatedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          quantity: Number(item.quantity) || 1,
          unit: item.unit,
          unitPrice: Number(item.unitPrice) || 0,
          discountPercent: Number(item.discountPercent) || 0,
          gstRate: Number(item.gstRate) || 18,
          baseTotal: item.baseTotal,
          discountAmt: item.discountAmt,
          netTaxable: item.netTaxable,
          gstAmt: item.gstAmt,
          total: item.total,
        })),
        subtotal,
        discountTotal,
        taxTotal,
        freightCharges: Number(freightCharges || 0),
        grandTotal,
        validUntil,
        paymentTerms,
        deliveryTerms,
        enquiryId: activeEnquiry?.id || activeQuotation?.enquiryId || null,
        customerId: selectedCustomerId || null,
        status: targetStatus,
      };

      let resultQuotation = null;

      if (activeQuotation?.id) {
        // Update existing quotation draft
        resultQuotation = await updateQuotation({
          id: activeQuotation.id,
          updates: quotationPayload,
        });
        addToast({
          title: isDraft ? 'Quotation Draft Saved' : 'Quotation Issued to Buyer',
          message: isDraft
            ? `Quotation #${resultQuotation?.quotationNumber || activeQuotation.quotationNumber} updated as draft`
            : `Quotation #${resultQuotation?.quotationNumber || activeQuotation.quotationNumber} sent to client`,
          type: 'success',
        });
      } else {
        // Create new quotation
        resultQuotation = await createQuotation(quotationPayload);
        addToast({
          title: isDraft ? 'Draft Saved' : 'Quotation Proposal Issued',
          message: isDraft
            ? `Proposal saved to drafts`
            : `Proposal issued to ${buyer.company}`,
          type: 'success',
        });
      }

      const targetId = resultQuotation?.id || activeQuotation?.id;
      if (targetId) {
        navigate(`/seller/quotations/${targetId}`);
      } else {
        navigate('/seller/quotations');
      }
    } catch (err) {
      console.error('Failed to save quotation:', err);
      addToast({
        title: 'Submission Failed',
        message: err.message || 'Could not save quotation proposal. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSavingDraft(false);
      setIsSending(false);
    }
  };

  // Find customer object for address selector helper
  const selectedCustomerObj = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
            Quotations
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeQuotation?.id ? 'Edit B2B Quotation Proposal' : 'Create Formal B2B Quotation'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate structured pricing proposal with itemized GST schedule and commercial delivery terms
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => handleSubmit('Draft')}
            leftIcon={Save}
            isLoading={isSavingDraft}
            disabled={isSavingDraft || isSending}
          >
            {isSavingDraft ? 'Saving Draft...' : 'Save Draft'}
          </Button>

          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => handleSubmit('Sent to Buyer')}
            leftIcon={Send}
            isLoading={isSending}
            disabled={isSavingDraft || isSending}
          >
            {isSending ? 'Sending Quotation...' : 'Send Quotation to Buyer'}
          </Button>
        </div>
      </div>

      {/* Origin Banner if created from Buyer Enquiry */}
      {activeEnquiry && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Connected to RFQ Enquiry <strong>#{activeEnquiry.id}</strong> from{' '}
              <strong>{activeEnquiry.buyerName}</strong> ({activeEnquiry.company}):{' '}
              <em>{activeEnquiry.productName}</em>
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
            RFQ Imported
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. Buyer Information Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" /> Buyer & Delivery Destination Details
            </h3>

            {customers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Select Customer from CRM:</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="text-xs h-8 px-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Choose Existing Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Input
                label="Buyer Company Name"
                placeholder="e.g. Larsen & Toubro Heavy Infra"
                value={buyer.company}
                onChange={(e) => {
                  setBuyer({ ...buyer, company: e.target.value });
                  if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }));
                }}
                required
              />
              {errors.company && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.company}</p>
              )}
            </div>

            <div>
              <Input
                label="Contact Person Name"
                placeholder="e.g. Vikas Malhotra"
                value={buyer.name}
                onChange={(e) => {
                  setBuyer({ ...buyer, name: e.target.value });
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                required
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="Buyer GSTIN (Tax ID)"
                placeholder="e.g. 27AABCS9988H1ZZ"
                value={buyer.gstin}
                onChange={(e) => setBuyer({ ...buyer, gstin: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Contact Phone"
                placeholder="e.g. +91 98201 55667"
                value={buyer.phone}
                onChange={(e) => {
                  setBuyer({ ...buyer, phone: e.target.value });
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                required
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.phone}</p>
              )}
            </div>

            <div>
              <Input
                label="Official Email"
                placeholder="e.g. procurement@buyercompany.com"
                type="email"
                value={buyer.email}
                onChange={(e) => {
                  setBuyer({ ...buyer, email: e.target.value });
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                required
              />
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            <div>
              <Input
                label="Validity Expiry Date"
                type="date"
                value={validUntil}
                onChange={(e) => {
                  setValidUntil(e.target.value);
                  if (errors.validUntil) setErrors((prev) => ({ ...prev, validUntil: undefined }));
                }}
                required
              />
              {errors.validUntil && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.validUntil}</p>
              )}
            </div>
          </div>

          <div>
            <Textarea
              label="Project Site Delivery Address"
              placeholder="e.g. Project Bay 4, Tower C, Industrial Estate, Sector 62..."
              value={buyer.address}
              onChange={(e) => {
                setBuyer({ ...buyer, address: e.target.value });
                if (errors.address) setErrors((prev) => ({ ...prev, address: undefined }));
              }}
              rows={2}
              required
            />
            {errors.address && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.address}</p>
            )}

            {/* Address quick-pick chips if selected CRM customer has multiple addresses */}
            {selectedCustomerObj &&
              selectedCustomerObj.deliveryAddress &&
              selectedCustomerObj.billingAddress &&
              selectedCustomerObj.deliveryAddress !== selectedCustomerObj.billingAddress && (
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>Available Saved Addresses:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setBuyer((prev) => ({ ...prev, address: selectedCustomerObj.deliveryAddress }))
                    }
                    className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    [Use Delivery Address]
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBuyer((prev) => ({ ...prev, address: selectedCustomerObj.billingAddress }))
                    }
                    className="text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    [Use Billing Address]
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* 2. Materials & Commercial Pricing Schedule */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Materials & Commercial Pricing Schedule
            </h3>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={handleAddItem}
              leftIcon={Plus}
            >
              Add Product Line
            </Button>
          </div>

          {errors.items && (
            <p className="text-xs text-rose-600 font-semibold">{errors.items}</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="bg-slate-50 font-bold uppercase text-[10.5px] text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-2/5">Construction Material</th>
                  <th className="p-3 w-28">Quantity</th>
                  <th className="p-3 w-32">Unit Price (₹)</th>
                  <th className="p-3 w-24">Discount %</th>
                  <th className="p-3 w-24">GST %</th>
                  <th className="p-3 text-right">Line Total (₹)</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item, index) => {
                  const calc = calculatedItems[index] || {};
                  const lineErr = errors.itemErrors?.[index] || {};

                  return (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className={cn(
                            'w-full text-xs p-2 bg-white border rounded-md font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer',
                            lineErr.product ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                          )}
                        >
                          <option value="">-- Choose Product from Catalog --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name || p.title} {p.sku ? `(${p.sku})` : ''} — ₹{p.sellingPrice || p.price || 0} / {p.unit || 'Unit'}
                            </option>
                          ))}
                        </select>
                        {lineErr.product && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{lineErr.product}</p>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className={cn(
                              'w-20 p-2 bg-white border rounded-md text-xs font-bold',
                              lineErr.quantity ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                            )}
                          />
                          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                            {item.unit || 'Unit'}
                          </span>
                        </div>
                        {lineErr.quantity && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{lineErr.quantity}</p>
                        )}
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className={cn(
                            'w-28 p-2 bg-white border rounded-md text-xs font-mono font-bold',
                            lineErr.unitPrice ? 'border-rose-300 ring-1 ring-rose-300' : 'border-slate-200'
                          )}
                        />
                        {lineErr.unitPrice && (
                          <p className="text-[10px] text-rose-600 mt-0.5">{lineErr.unitPrice}</p>
                        )}
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) =>
                            handleItemChange(index, 'discountPercent', e.target.value)
                          }
                          className="w-16 p-2 bg-white border border-slate-200 rounded-md text-xs font-mono"
                        />
                      </td>

                      <td className="p-3">
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                          className="p-2 bg-white border border-slate-200 rounded-md text-xs font-bold text-emerald-700 cursor-pointer"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      <td className="p-3 text-right font-black text-slate-900 font-mono">
                        {formatCurrency(calc.total || 0)}
                      </td>

                      <td className="p-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                            title="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-100 gap-6">
            <div className="w-full sm:max-w-md space-y-3">
              <Input
                label="Freight & Logistics Surcharge (₹)"
                type="number"
                min="0"
                value={freightCharges}
                onChange={(e) => setFreightCharges(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Material Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Net Taxable Amount:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(netTaxableTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax Sum:</span>
                <span className="font-bold text-slate-900">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Freight / Logistics:</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(Number(freightCharges || 0))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Commercial Terms & Conditions Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Commercial Terms & Delivery Guidelines
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Payment Terms & Milestone Schedule"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={2}
            />

            <Textarea
              label="Delivery Protocol & Site Logistics"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
