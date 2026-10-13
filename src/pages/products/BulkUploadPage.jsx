import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Edit2,
  Package,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/formatters';

const SAMPLE_CSV_TEMPLATE = [
  {
    ProductName: 'Tata Tiscon 550D TMT Steel Rebars 12mm',
    SKU: 'STEEL-TATA-550D-12MM',
    Category: 'civil',
    Brand: 'Tata Tiscon',
    SellingPrice: 63500,
    MRP: 67000,
    Unit: 'Ton',
    Stock: 65,
    MOQ: 5,
    GSTRate: 18,
    HSNCode: '72142090',
  },
  {
    ProductName: 'UltraTech Super Cement 53 Grade 50Kg',
    SKU: 'CEM-ULT-OPC-53',
    Category: 'civil',
    Brand: 'UltraTech Cement',
    SellingPrice: 380,
    MRP: 435,
    Unit: 'Bag',
    Stock: 3500,
    MOQ: 100,
    GSTRate: 28,
    HSNCode: '25232910',
  },
  {
    ProductName: 'Polycab Industrial FRLS Copper Cable 90m',
    SKU: 'ELE-POL-FRLS-90M',
    Category: 'electrical',
    Brand: 'Polycab',
    SellingPrice: 3100,
    MRP: 3600,
    Unit: 'Piece',
    Stock: 180,
    MOQ: 10,
    GSTRate: 18,
    HSNCode: '85444990',
  },
];

export function BulkUploadPage() {
  const navigate = useNavigate();
  const { bulkImport, isImporting } = useProducts();
  const { categories } = useCategories();
  const addToast = useUIStore((state) => state.addToast);

  const [step, setStep] = useState(1); // 1: Upload, 2: Validate & Fix, 3: Success
  const [parsedRows, setParsedRows] = useState([]);
  const [importedCount, setImportedCount] = useState(0);

  const handleDownloadTemplate = () => {
    exportToCsv('HinchMart_Bulk_Product_Upload_Template', SAMPLE_CSV_TEMPLATE);
    addToast({
      title: 'Template Downloaded',
      message: 'Fill the template with your construction material catalog and re-upload',
      type: 'info',
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        addToast({
          title: 'Empty File',
          message: 'The uploaded CSV file does not contain any product records.',
          type: 'warning',
        });
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj = {};
        headers.forEach((h, index) => {
          rowObj[h] = values[index] || '';
        });

        const name = rowObj.ProductName || rowObj.name || rowObj.Title || `Product ${i}`;
        const sku = rowObj.SKU || rowObj.sku || '';
        const sellingPrice = parseFloat(rowObj.SellingPrice || rowObj.price || 0) || 0;
        const mrp = parseFloat(rowObj.MRP || rowObj.mrp || 0) || Math.round(sellingPrice * 1.15);
        const category = rowObj.Category || rowObj.category || 'Civil & Structural';
        const brand = rowObj.Brand || rowObj.brand || '';
        const unit = rowObj.Unit || rowObj.unit || 'Piece';
        const stock = parseInt(rowObj.Stock || rowObj.stock || 0, 10) || 0;
        const moq = parseInt(rowObj.MOQ || rowObj.moq || 1, 10) || 1;
        const gstRate = parseFloat(rowObj.GSTRate || rowObj.gst || 18) || 18;
        const hsnCode = rowObj.HSNCode || rowObj.hsn || '';

        const errors = [];
        if (!sku) errors.push('Missing SKU Code');
        if (!name) errors.push('Missing Product Name');
        if (sellingPrice <= 0) errors.push('Invalid Price');

        rows.push({
          id: i,
          name,
          sku,
          category,
          brand,
          sellingPrice,
          mrp,
          unit,
          stock,
          moq,
          gstRate,
          hsnCode,
          errors,
        });
      }

      setParsedRows(rows);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleFixRow = (id, field, value) => {
    setParsedRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // Revalidate
          const errors = [];
          if (!updated.sku) errors.push('Missing SKU Code');
          if (!updated.name) errors.push('Missing Product Name');
          if (!updated.sellingPrice || updated.sellingPrice <= 0) errors.push('Invalid Price');
          return { ...updated, errors };
        }
        return r;
      })
    );
  };

  const handleDeleteRow = (id) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleCommitImport = async () => {
    if (invalidRows.length > 0) {
      addToast({
        title: 'Validation Errors Found',
        message: 'Please fix or remove the highlighted invalid rows before importing',
        type: 'warning',
      });
      return;
    }

    const payload = validRows.map((r) => ({
      name: r.name,
      sku: r.sku,
      category: r.category,
      subcategory: 'Standard Supply',
      brand: r.brand,
      sellingPrice: Number(r.sellingPrice),
      mrp: Number(r.mrp),
      unit: r.unit,
      stock: Number(r.stock),
      moq: Number(r.moq),
      gstRate: Number(r.gstRate),
      hsnCode: r.hsnCode,
      shortDescription: `${r.brand} ${r.name} for construction projects.`,
      fullDescription: `Commercial supply of ${r.name} under standard Indian quality specifications.`,
      images: [
        'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
      ],
      warehouseId: 'wh_1',
      lowStockThreshold: Math.round(Number(r.stock) * 0.15),
      status: 'Active',
      approvalStatus: 'Approved',
    }));

    await bulkImport(payload);
    setImportedCount(payload.length);
    setStep(3);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/products">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Products
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Bulk Construction Product Import
            </h1>
            <p className="text-xs text-slate-500">
              Upload multiple material listings via Excel or CSV spreadsheet
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownloadTemplate}
          leftIcon={Download}
        >
          Download Excel Template
        </Button>
      </div>

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Upload Products CSV / Excel Spreadsheet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload your completed template containing SKUs, product titles, categories, GST rates, and available inventory.
            </p>

            <label className="p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-all space-y-2 group block">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 mx-auto transition-colors" />
              <p className="text-xs font-bold text-slate-800">
                Click to browse or drop completed spreadsheet (.CSV) here
              </p>
              <p className="text-[11px] text-slate-400">Supports .CSV up to 25MB</p>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: Validation & Inline Fix */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Total Rows Read</span>
              <span className="text-lg font-extrabold text-slate-900">{parsedRows.length}</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 font-semibold block">Valid Ready to Import</span>
              <span className="text-lg font-extrabold text-emerald-800">{validRows.length}</span>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                invalidRows.length > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="font-semibold block">Rows with Errors</span>
              <span className="text-lg font-extrabold">{invalidRows.length}</span>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-700 font-semibold block">Target Warehouse</span>
              <span className="text-xs font-bold text-blue-900 truncate block">
                Bhiwandi Central
              </span>
            </div>
          </div>

          {/* Validation Alert */}
          {invalidRows.length > 0 ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                <strong>{invalidRows.length} row(s) contain validation errors.</strong> You can correct the fields directly in the table below or delete the row before proceeding.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                All <strong>{validRows.length} rows passed validation.</strong> Ready to publish to your seller catalog.
              </span>
            </div>
          )}

          {/* Inline Edit Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Selling Price (₹)</th>
                  <th className="py-2.5 px-3">Stock & Unit</th>
                  <th className="py-2.5 px-3">GST %</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {parsedRows.map((row) => {
                  const hasError = row.errors.length > 0;

                  return (
                    <tr
                      key={row.id}
                      className={hasError ? 'bg-rose-50/40' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-3">
                        {hasError ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleFixRow(row.id, 'name', e.target.value)}
                          className="w-48 bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500 font-semibold"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={row.sku}
                          placeholder="ENTER SKU"
                          onChange={(e) => handleFixRow(row.id, 'sku', e.target.value.toUpperCase())}
                          className={`w-36 bg-white border rounded px-2 py-1 text-xs font-mono font-bold ${
                            !row.sku
                              ? 'border-rose-500 ring-2 ring-rose-200'
                              : 'border-slate-300'
                          }`}
                        />
                      </td>

                      <td className="py-3 px-3 capitalize">{row.category.replace('-', ' ')}</td>

                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={row.sellingPrice}
                          onChange={(e) => handleFixRow(row.id, 'sellingPrice', e.target.value)}
                          className="w-24 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                        />
                      </td>

                      <td className="py-3 px-3">
                        {row.stock} {row.unit}
                      </td>

                      <td className="py-3 px-3 font-bold">{row.gstRate}%</td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" size="md" onClick={() => setStep(1)} leftIcon={ArrowLeft}>
              Re-upload File
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCommitImport}
              isLoading={isImporting}
              disabled={invalidRows.length > 0}
              rightIcon={ArrowRight}
            >
              Import {validRows.length} Valid Products
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Success Confirmation */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center space-y-5 animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-900">
            Bulk Import Successfully Processed!
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            <strong>{importedCount} construction products</strong> have been validated, assigned to your primary warehouse, and published to your live HinchMart catalog.
          </p>

          <div className="flex justify-center gap-3 pt-4">
            <Link to="/seller/products">
              <Button variant="primary" size="lg" leftIcon={Package}>
                View All Products in Catalog
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setStep(1);
                setParsedRows([]);
              }}
            >
              Import Another Batch
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
