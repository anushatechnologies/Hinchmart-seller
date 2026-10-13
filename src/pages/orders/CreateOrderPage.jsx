import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Building,
  ArrowLeft,
  CheckCircle2,
  Package,
  Truck,
  IndianRupee,
  Users,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';

export function CreateOrderPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { products = [] } = useProducts();
  const { customers = [] } = useCustomers();
  const { createOrder, isCreatingOrder } = useOrders();
  const { profile } = useSellerProfile();

  const customerFromState = location.state?.customer;

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/seller/orders');
    }
  };

  // Buyer State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerFromState?.id || '');
  const [buyer, setBuyer] = useState({
    name: customerFromState?.name || '',
    company: customerFromState?.companyName || '',
    phone: customerFromState?.mobile || '',
    email: customerFromState?.email || '',
    gstin: customerFromState?.gstin || '',
    address: customerFromState?.deliveryAddress || '',
    city: customerFromState?.city || '',
    siteName: customerFromState?.companyName ? `${customerFromState.companyName} Site` : '',
  });

  const handleSelectCustomer = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setBuyer({
        name: found.name || '',
        company: found.companyName || '',
        phone: found.mobile || '',
        email: found.email || '',
        gstin: found.gstin || '',
        address: found.deliveryAddress || `${found.city || ''}, ${found.state || ''}`,
        city: found.city || 'Mumbai',
        siteName: `${found.companyName || 'Project'} Site`,
      });
    }
  };

  // Order Details
  const defaultDeliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [orderStatus, setOrderStatus] = useState('New');
  const [warehouseId, setWarehouseId] = useState('wh_1');
  const [notes, setNotes] = useState('Purchase order generated directly by seller via portal.');

  // Items State
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || '',
      name: products[0]?.name || '',
      sku: products[0]?.sku || '',
      quantity: 1,
      unit: products[0]?.unit || 'Unit',
      unitPrice: products[0]?.sellingPrice || products[0]?.price || 0,
      gstRate: products[0]?.gstRate || 18,
    },
  ]);

  const [freightCharges, setFreightCharges] = useState(0);

  const handleProductSelect = (index, prodId) => {
    const selectedProd = products.find((p) => p.id === prodId);
    if (!selectedProd) return;

    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selectedProd.id,
      name: selectedProd.name,
      sku: selectedProd.sku,
      unit: selectedProd.unit,
      unitPrice: selectedProd.sellingPrice,
      gstRate: selectedProd.gstRate || 18,
    };
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]:
        field === 'quantity' || field === 'unitPrice' || field === 'gstRate'
          ? Number(value)
          : value,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd?.id || '',
        name: defaultProd?.name || '',
        sku: defaultProd?.sku || '',
        quantity: 100,
        unit: defaultProd?.unit || 'Unit',
        unitPrice: defaultProd?.sellingPrice || 100,
        gstRate: defaultProd?.gstRate || 18,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const total = (item.quantity || 0) * (item.unitPrice || 0);
    const gstAmt = Math.round((total * (item.gstRate || 0)) / 100);
    return {
      ...item,
      total,
      gstAmt,
    };
  });

  const subtotal = calculatedItems.reduce((acc, item) => acc + item.total, 0);
  const gstAmount = calculatedItems.reduce((acc, item) => acc + item.gstAmt, 0);
  const totalAmount = subtotal + gstAmount + Number(freightCharges || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!buyer.company || !buyer.name || items.length === 0) {
      return;
    }

    try {
      const orderPayload = {
        buyer: {
          name: buyer.name,
          company: buyer.company,
          phone: buyer.phone,
          email: buyer.email,
          gstin: buyer.gstin,
        },
        deliveryAddress: {
          siteName: buyer.siteName || `${buyer.company} Site`,
          address: buyer.address,
          city: buyer.city,
          state: 'Maharashtra',
        },
        items: calculatedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          unit: item.unit,
          gstRate: item.gstRate,
          total: item.total,
        })),
        subtotal,
        gstAmount,
        freightCharges: Number(freightCharges || 0),
        totalAmount,
        paymentStatus,
        orderStatus,
        warehouseId,
        deliveryDate,
        notes,
      };

      const newOrder = await createOrder(orderPayload);
      if (newOrder?.id) {
        navigate(`/seller/orders/${newOrder.id}`);
      } else {
        navigate('/seller/orders');
      }
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Return to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
              <span>Create Order</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Generate a new purchase order for verified buyers and schedule fulfillment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" type="button" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isCreatingOrder}
            leftIcon={CheckCircle2}
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* 1. Customer Selection & Buyer Details */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <span>Buyer & Project Site Information</span>
          </h2>
          {customers.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md p-1.5 font-semibold text-slate-700"
              >
                <option value="">Select Existing Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buyer Company Name"
            value={buyer.company}
            onChange={(e) => setBuyer({ ...buyer, company: e.target.value })}
            required
          />
          <Input
            label="Contact Person Name"
            value={buyer.name}
            onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
            required
          />
          <Input
            label="Buyer GSTIN"
            placeholder="e.g. 27AAACL1234F1Z1"
            value={buyer.gstin}
            onChange={(e) => setBuyer({ ...buyer, gstin: e.target.value })}
          />
          <Input
            label="Contact Phone"
            value={buyer.phone}
            onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
            required
          />
          <Input
            label="Official Email"
            value={buyer.email}
            onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
            required
          />
          <Input
            label="Site Name / Destination Node"
            value={buyer.siteName}
            onChange={(e) => setBuyer({ ...buyer, siteName: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Textarea
              label="Delivery Site Address"
              value={buyer.address}
              onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
              rows={2}
              required
            />
          </div>
          <div>
            <Input
              label="Destination City"
              value={buyer.city}
              onChange={(e) => setBuyer({ ...buyer, city: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      {/* 2. Order Delivery & Terms */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
          <Truck className="w-4 h-4 text-blue-600" />
          <span>Fulfillment & Payment Scheduling</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Estimated Delivery Date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />

          <Select
            label="Dispatch Warehouse"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="wh_1">Bhiwandi Central Bay 3 (Primary)</option>
            <option value="wh_2">Panvel Heavy Logistics Yard</option>
            <option value="wh_3">Taloja Industrial Depot</option>
          </Select>

          <Select
            label="Initial Order Status"
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
          >
            <option value="New">New / Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
          </Select>

          <Select
            label="Payment Status"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="Pending">Pending Review</option>
            <option value="Escrow Secured">Escrow Secured</option>
            <option value="Paid">Paid in Advance</option>
            <option value="Credit (30 Days)">Credit (30 Days)</option>
          </Select>
        </div>

        <div>
          <Textarea
            label="Internal Order Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* 3. Products & Materials Schedule */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" />
            <span>Materials & Line Items</span>
          </h2>
          <Button variant="secondary" size="sm" type="button" onClick={handleAddItem} leftIcon={Plus}>
            Add Product Line
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 font-bold uppercase text-[10.5px] text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 w-2/5">Construction Material</th>
                <th className="p-3 w-28">Quantity</th>
                <th className="p-3 w-32">Unit Price (₹)</th>
                <th className="p-3 w-24">GST %</th>
                <th className="p-3 text-right">Line Total (₹)</th>
                <th className="p-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {items.map((item, index) => {
                const calc = calculatedItems[index] || {};
                return (
                  <tr key={index}>
                    <td className="p-3">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-20 p-2 bg-white border border-slate-200 rounded-md text-xs font-bold"
                        />
                        <span className="text-[11px] text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-28 p-2 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                        className="w-20 p-2 bg-white border border-slate-200 rounded-md text-xs font-bold text-emerald-700"
                      >
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
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer p-1 transition-colors"
                        title="Remove line item"
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
      </div>

      {/* 4. Commercial Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Order Processing Notice</span>
          </h3>
          <p>
            This order will be added to the seller fulfillment board. The assigned warehouse bay will receive allocation
            notices, and a Commercial Tax Invoice can be issued once picking starts.
          </p>
          <p className="font-semibold text-slate-700">
            Fulfillment Seller: {profile?.companyName || 'Seller Enterprise'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Taxable Subtotal:</span>
            <span className="font-semibold font-mono">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between text-xs text-slate-600">
            <span>Estimated GST Amount:</span>
            <span className="font-semibold font-mono">{formatCurrency(gstAmount)}</span>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
            <span>Freight & Handling (₹):</span>
            <input
              type="number"
              min="0"
              value={freightCharges}
              onChange={(e) => setFreightCharges(e.target.value)}
              className="w-28 p-1.5 text-right bg-slate-50 border border-slate-200 rounded font-mono font-bold text-xs"
            />
          </div>

          <div className="flex justify-between items-center text-base font-black text-slate-900 pt-3 border-t border-slate-200">
            <span>Total Order Value:</span>
            <span className="text-emerald-700 font-mono text-lg">{formatCurrency(totalAmount)}</span>
          </div>

          <div className="pt-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              type="submit"
              isLoading={isCreatingOrder}
              leftIcon={CheckCircle2}
            >
              Confirm & Create Order
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
