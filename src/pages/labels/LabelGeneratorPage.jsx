import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Printer,
  Download,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Package,
  History,
  Building,
  FileCheck,
  Layout,
  Maximize2,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useLabelHistory } from '../../hooks/useLabels';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { CustomerSearchInput } from '../../components/customers/CustomerSearchInput';
import { ProductLabelPreview } from '../../components/labels/ProductLabelPreview';
import { triggerPrint } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';

export function LabelGeneratorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const addToast = useUIStore((state) => state.addToast);

  const { products } = useProducts();
  const { profile } = useSellerProfile();
  const { createLabel, isCreating } = useLabelHistory();

  // Preloads from state
  const preselectedCustomerFromState = location.state?.preselectedCustomer || null;
  const reloadedLabel = location.state?.reloadedLabel || null;
  const preselectedProductId =
    location.state?.selectedProductId || reloadedLabel?.productId || products[0]?.id;

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomerFromState);
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId);
  const [quantity, setQuantity] = useState(reloadedLabel?.quantity || 100);
  const [batchNo, setBatchNo] = useState(reloadedLabel?.batchNumber || 'B-2026/LOT-8841');
  const [mfgDate, setMfgDate] = useState(reloadedLabel?.manufacturingDate || '2026-08-15');
  const [expiryDate, setExpiryDate] = useState(reloadedLabel?.expiryDate || '2027-08-14');
  const [labelSize, setLabelSize] = useState(reloadedLabel?.labelSize || '4x6'); // '4x6' | '3x2' | '2x1'
  const [labelTemplate, setLabelTemplate] = useState('Standard Industrial Pallet Tag');
  const [qrPosition, setQrPosition] = useState(reloadedLabel?.qrPosition || 'bottom-right'); // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  const [qrSize, setQrSize] = useState(reloadedLabel?.qrSize || 'medium'); // 'small' | 'medium' | 'large'
  const [labelsPerPage, setLabelsPerPage] = useState(reloadedLabel?.labelsPerPage || 1);
  const [validationError, setValidationError] = useState('');
  const [generatedLabelRecord, setGeneratedLabelRecord] = useState(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (preselectedCustomerFromState) {
      setSelectedCustomer(preselectedCustomerFromState);
    }
  }, [preselectedCustomerFromState]);

  // Validation
  const validateBeforeAction = () => {
    if (!selectedCustomer) {
      setValidationError('Please select a customer before generating the label.');
      addToast({
        title: 'Customer Required',
        message: 'Please select an authorized customer from the database before generating labels.',
        type: 'warning',
      });
      return false;
    }

    if (selectedCustomer.status !== 'Active') {
      setValidationError(
        `This customer is currently marked as ${selectedCustomer.status}. Please select an active customer.`
      );
      addToast({
        title: 'Inactive Customer',
        message: 'Selected customer account is suspended. Only active clients are authorized for product labels.',
        type: 'error',
      });
      return false;
    }

    if (!selectedProduct) {
      setValidationError('Please select a product.');
      return false;
    }

    if (!batchNo) {
      setValidationError('Please enter a valid Batch / Heat Lot number.');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleGenerateLabel = async () => {
    if (!validateBeforeAction()) return;

    const labelPayload = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerCompany: selectedCustomer.companyName,
      customerGstin: selectedCustomer.gstin,
      customerMobile: selectedCustomer.mobile,
      customerDeliveryAddress: selectedCustomer.deliveryAddress,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      productBrand: selectedProduct.brand,
      productImage: selectedProduct.images?.[0] || '',
      mrp: selectedProduct.mrp,
      sellingPrice: selectedProduct.sellingPrice,
      gstRate: selectedProduct.gstRate,
      unit: selectedProduct.unit,
      quantity: Number(quantity),
      batchNumber: batchNo,
      manufacturingDate: mfgDate,
      expiryDate: expiryDate,
      labelSize,
      labelTemplate,
      qrPosition,
      qrSize,
      labelsPerPage,
      generatedBy: profile?.name || 'Authorized Seller',
      status: 'Generated',
    };

    const res = await createLabel(labelPayload);
    setGeneratedLabelRecord(res);

    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const handlePrint = () => {
    if (!validateBeforeAction()) return;
    triggerPrint();
  };

  if (!selectedProduct) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header (No print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Product Label & Barcode Generator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical label boundary with internal QR Code box, GS1 Code128 barcodes, and client consignee credentials
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/seller/products/labels/history">
            <Button variant="secondary" size="sm" leftIcon={History}>
              Label History
            </Button>
          </Link>

          <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={Printer}>
            Print Labels
          </Button>
        </div>
      </div>

      {/* Top Validation Warning Banner */}
      {validationError && (
        <div className="no-print p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-3 text-xs text-rose-900 font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 5 COLS: Configuration Controls (No print) */}
        <div className="no-print lg:col-span-5 space-y-4">
          {/* 1. Customer Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Building className="w-4 h-4 text-amber-500" />
              1. Customer Selection (Admin Controlled)
            </h3>

            <CustomerSearchInput
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(cust) => {
                setSelectedCustomer(cust);
                if (cust.status === 'Active') setValidationError('');
              }}
              onClearCustomer={() => setSelectedCustomer(null)}
            />
          </div>

          {/* 2. Product & Batch Configuration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Package className="w-4 h-4 text-amber-500" />
              2. Product & Batch Information
            </h3>

            <Select
              label="Select Material from Catalog"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (Product ID: ${p.id || p.sku})`,
              }))}
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`Quantity (${selectedProduct.unit})`}
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />

              <Input
                label="Batch / Heat Lot #"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Mfg Date"
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                required
              />

              <Input
                label="Expiry / Retest Date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* 3. QR Code & Label Layout Customization */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <QrCode className="w-4 h-4 text-amber-500" />
              3. QR Code Positioning (Inside Label Box)
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="QR Code Position Inside Label"
                options={[
                  { value: 'bottom-right', label: 'Bottom Right (Standard)' },
                  { value: 'bottom-left', label: 'Bottom Left' },
                  { value: 'top-right', label: 'Top Right' },
                  { value: 'top-left', label: 'Top Left' },
                  { value: 'center', label: 'Center Split' },
                ]}
                value={qrPosition}
                onChange={(e) => setQrPosition(e.target.value)}
              />

              <Select
                label="QR Code Size"
                options={[
                  { value: 'small', label: 'Small (Compact)' },
                  { value: 'medium', label: 'Medium (Recommended)' },
                  { value: 'large', label: 'Large (High Density)' },
                ]}
                value={qrSize}
                onChange={(e) => setQrSize(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <Select
                label="Physical Label Format"
                options={[
                  { value: '4x6', label: '4" x 6" Transport & Pallet Tag' },
                  { value: '3x2', label: '3" x 2" Pallet / Bundle Steel Tag' },
                  { value: '2x1', label: '2" x 1" Compact Shelf Barcode' },
                ]}
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value)}
              />

              <Select
                label="Grid Copies / Page"
                options={[
                  { value: 1, label: '1 Label (Single)' },
                  { value: 2, label: '2 Labels (Split)' },
                  { value: 4, label: '4 Labels (A4 Grid)' },
                  { value: 6, label: '6 Labels (A4 Grid)' },
                ]}
                value={labelsPerPage}
                onChange={(e) => setLabelsPerPage(Number(e.target.value))}
              />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleGenerateLabel}
                isLoading={isCreating}
                rightIcon={FileCheck}
              >
                Generate & Save Label Record
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLS: Live Label Layout Preview & Print Sheet */}
        <div className="lg:col-span-7">
          <div className="bg-slate-100 p-6 rounded-xl border border-slate-300 shadow-inner flex flex-col items-center">
            <div className="no-print flex items-center justify-between w-full mb-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Physical Label Safe Area Preview ({labelSize} format • QR: {qrPosition} • {qrSize})
              </span>

              {generatedLabelRecord && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Saved: {generatedLabelRecord.id}
                </span>
              )}
            </div>

            {/* Printable Container */}
            <div className="printable-area grid grid-cols-1 md:grid-cols-2 gap-4 w-full justify-center max-w-xl">
              {Array.from({ length: labelsPerPage }).map((_, index) => (
                <ProductLabelPreview
                  key={index}
                  product={selectedProduct}
                  customer={selectedCustomer}
                  batchNo={batchNo}
                  mfgDate={mfgDate}
                  expiryDate={expiryDate}
                  quantity={quantity}
                  labelSize={labelSize}
                  labelTemplate={labelTemplate}
                  qrPosition={qrPosition}
                  qrSize={qrSize}
                  profile={profile}
                  labelId={generatedLabelRecord?.id || 'LBL-PREVIEW'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
