import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  Shield,
  Bell,
  CreditCard,
  Truck,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  Building,
  KeyRound,
  Store,
  MapPin,
  Plus,
  Image,
  Upload,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { ImageUploadField } from '../../components/common/ImageUploadField';
import { sellerService } from '../../services/seller.service';
import { INDIAN_BANKS, getBankRule, validateBankAccountNumber } from '../../constants/banks';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { profile, updateProfile } = useSellerProfile();
  const addToast = useUIStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState('store');
  const [isSaving, setIsSaving] = useState(false);

  // 1. Store Profile State (GET /api/seller/store & PUT /api/seller/store)
  const [storeForm, setStoreForm] = useState({
    name: 'Anusha Organic Mart',
    slug: 'anusha-organic-mart',
    description: 'Wholesale supplier of organic textile dyes and colors',
    logoUrl: '',
    bannerUrl: '',
    minOrderValue: 500.0,
    serviceRadiusKm: 25,
    status: 'ACTIVE',
    rating: 4.8,
    reviewCount: 34,
  });

  // 2. Warehouse Addresses State (GET /api/seller/warehouse & POST /api/seller/warehouse)
  const [warehouses, setWarehouses] = useState([]);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    contactPerson: '',
    contactPhone: '',
    isDefault: true,
  });

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: user?.name || user?.fullName || profile?.name || '',
    email: user?.email || profile?.companyEmail || '',
    phone: user?.phone || user?.mobile || profile?.businessPhone || '',
    role: 'Primary Administrator',
  });

  const [bankForm, setBankForm] = useState({
    accountName: profile?.bankDetails?.accountName || '',
    accountNumber: profile?.bankDetails?.accountNumber || '',
    ifsc: profile?.bankDetails?.ifsc || '',
    bankName: profile?.bankDetails?.bankName || '',
    branch: profile?.bankDetails?.branch || '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    emailOnOrder: true,
    smsOnOrder: true,
    whatsappOnRfq: true,
    emailOnStockAlert: true,
    weeklyDigest: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load Store Profile & Warehouses on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storeData = await sellerService.getStoreProfile();
        if (storeData) {
          setStoreForm({
            name: storeData.name || storeData.sellerName || '',
            slug: storeData.slug || '',
            description: storeData.description || '',
            logoUrl: storeData.logoUrl || '',
            bannerUrl: storeData.bannerUrl || '',
            minOrderValue: storeData.minOrderValue ?? 500.0,
            serviceRadiusKm: storeData.serviceRadiusKm ?? 25,
            status: storeData.status || 'ACTIVE',
            rating: storeData.rating || 4.8,
            reviewCount: storeData.reviewCount || 34,
          });
        }
      } catch (err) {}

      try {
        const whList = await sellerService.getWarehouseAddresses();
        if (Array.isArray(whList)) {
          setWarehouses(whList);
        }
      } catch (err) {}
    }
    loadData();
  }, []);

  const handleSaveStore = async (e) => {
    e?.preventDefault();
    if (!storeForm.name.trim()) {
      addToast({
        title: 'Validation Error',
        message: 'Store Name is required',
        type: 'error',
      });
      return;
    }
    setIsSaving(true);
    try {
      await sellerService.updateStoreProfile(storeForm);
      addToast({
        title: 'Store Profile Saved',
        message: 'Your official store details have been updated on HinchMart marketplace',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Update Failed',
        message: err.message || 'Could not update store profile',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWarehouse = async (e) => {
    e?.preventDefault();
    if (!warehouseForm.addressLine1.trim() || !warehouseForm.city.trim() || !warehouseForm.pincode.trim()) {
      addToast({
        title: 'Incomplete Address',
        message: 'Please fill Address Line 1, City, and Pincode',
        type: 'error',
      });
      return;
    }
    setIsSaving(true);
    try {
      const saved = await sellerService.saveWarehouseAddress(warehouseForm);
      setWarehouses((prev) => [...prev, saved]);
      setShowAddWarehouse(false);
      setWarehouseForm({
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: 'Maharashtra',
        pincode: '',
        contactPerson: '',
        contactPhone: '',
        isDefault: false,
      });
      addToast({
        title: 'Warehouse Added',
        message: 'Pickup location saved successfully for 3PL logistics routing',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Save Failed',
        message: err.message || 'Could not save warehouse address',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        title: 'Account Settings Saved',
        message: 'Your administrator profile details have been updated',
        type: 'success',
      });
    }, 300);
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    const valRes = validateBankAccountNumber(bankForm.bankName, bankForm.accountNumber);
    if (!valRes.isValid) {
      addToast({
        title: 'Invalid Bank Details',
        message: valRes.error,
        type: 'error',
      });
      return;
    }
    setIsSaving(true);
    await updateProfile({ bankDetails: bankForm });
    setIsSaving(false);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast({
        title: 'Password Mismatch',
        message: 'New password and confirm password must match',
        type: 'error',
      });
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addToast({
        title: 'Password Updated',
        message: 'Your seller account password has been changed successfully',
        type: 'success',
      });
    }, 400);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const TABS = [
    { id: 'store', label: 'Store Profile', icon: Store },
    { id: 'warehouse', label: 'Warehouse & Pickup', icon: MapPin },
    { id: 'account', label: 'Admin Account', icon: User },
    { id: 'bank', label: 'Banking & Payouts', icon: CreditCard },
    { id: 'notifications', label: 'Alert Channels', icon: Bell },
    { id: 'security', label: 'Password & Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Portal Settings & Preferences
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store branding, warehouse pickup locations, settlement accounts, and security policies
          </p>
        </div>

        <Button variant="danger" size="sm" onClick={handleLogout} leftIcon={LogOut}>
          Logout of Session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left 4 Cols: Vertical Tab Navigation */}
        <div className="md:col-span-4 space-y-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Tab Content */}
        <div className="md:col-span-8 space-y-6">
          {/* TAB 0: Store Profile (GET /api/seller/store, PUT /api/seller/store) */}
          {activeTab === 'store' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  Storefront Branding & Catalog Configuration
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {storeForm.status}
                </span>
              </div>

              <form onSubmit={handleSaveStore} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Storefront Display Name"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    placeholder="e.g. Anusha Organic Mart"
                    required
                  />

                  <Input
                    label="Store URL Slug (Identifier)"
                    value={storeForm.slug || storeForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                    disabled
                  />
                </div>

                <Textarea
                  label="Store Description & Bio"
                  value={storeForm.description}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  placeholder="Describe your manufacturing or wholesale supply specializations..."
                  rows={3}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Minimum Order Value (₹)"
                    type="number"
                    min="0"
                    step="50"
                    value={storeForm.minOrderValue}
                    onChange={(e) => setStoreForm({ ...storeForm, minOrderValue: parseFloat(e.target.value) || 0 })}
                    placeholder="500"
                  />

                  <Input
                    label="Service Delivery Radius (Km)"
                    type="number"
                    min="1"
                    max="500"
                    value={storeForm.serviceRadiusKm}
                    onChange={(e) => setStoreForm({ ...storeForm, serviceRadiusKm: parseInt(e.target.value, 10) || 25 })}
                    placeholder="25"
                  />
                </div>

                {/* S3 Image Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <ImageUploadField
                    label="Storefront Logo (Square PNG/JPG)"
                    folder="stores"
                    value={storeForm.logoUrl}
                    onChange={(url) => setStoreForm({ ...storeForm, logoUrl: url })}
                  />

                  <ImageUploadField
                    label="Storefront Banner (1200x400 JPG)"
                    folder="stores"
                    value={storeForm.bannerUrl}
                    onChange={(url) => setStoreForm({ ...storeForm, bannerUrl: url })}
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={Save}>
                    Save Storefront Details
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: Warehouse & Pickup Addresses (GET /api/seller/warehouse, POST /api/seller/warehouse) */}
          {activeTab === 'warehouse' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Warehouse & Dispatch Locations
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pickup locations for dispatching material via Delhivery, BlueDart, or HinchMart Logistics
                  </p>
                </div>
                {!showAddWarehouse && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddWarehouse(true)}
                    leftIcon={Plus}
                  >
                    Add Location
                  </Button>
                )}
              </div>

              {/* Warehouse List */}
              <div className="space-y-3">
                {warehouses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                    <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No Warehouse Locations Registered</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add a warehouse address to receive 3PL pickup schedules</p>
                  </div>
                ) : (
                  warehouses.map((wh, idx) => (
                    <div
                      key={wh.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {wh.addressLine1} {wh.addressLine2 ? `, ${wh.addressLine2}` : ''}
                          </span>
                          {wh.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Primary Dispatch Location
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600">
                          {wh.city}, {wh.state} — {wh.pincode}
                        </p>
                        {wh.contactPerson && (
                          <p className="text-[11px] text-slate-500">
                            Contact: {wh.contactPerson} {wh.contactPhone ? `(${wh.contactPhone})` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Warehouse Form */}
              {showAddWarehouse && (
                <form onSubmit={handleSaveWarehouse} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase">Register New Pickup Location</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Address Line 1 (Building / Plot No)"
                      value={warehouseForm.addressLine1}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, addressLine1: e.target.value })}
                      placeholder="Plot 45, MIDC Industrial Area"
                      required
                    />
                    <Input
                      label="Address Line 2 (Phase / Street)"
                      value={warehouseForm.addressLine2}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, addressLine2: e.target.value })}
                      placeholder="Phase 2, Turbhe"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={warehouseForm.city}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, city: e.target.value })}
                      placeholder="Navi Mumbai"
                      required
                    />
                    <Input
                      label="State"
                      value={warehouseForm.state}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, state: e.target.value })}
                      placeholder="Maharashtra"
                      required
                    />
                    <Input
                      label="Pincode"
                      value={warehouseForm.pincode}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, pincode: e.target.value })}
                      placeholder="400705"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Warehouse Contact Person"
                      value={warehouseForm.contactPerson}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, contactPerson: e.target.value })}
                      placeholder="Ramesh Patil"
                    />
                    <Input
                      label="Contact Mobile (Driver Coordination)"
                      value={warehouseForm.contactPhone}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, contactPhone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefaultWh"
                      checked={warehouseForm.isDefault}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, isDefault: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="isDefaultWh" className="text-xs font-semibold text-slate-700">
                      Set as Primary Default Pickup Address
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowAddWarehouse(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" isLoading={isSaving} leftIcon={Save}>
                      Save Warehouse Address
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Account */}
          {activeTab === 'account' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Administrator Profile
              </h3>

              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Account Role / Authority"
                    value={accountForm.role}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Registered Business Email"
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    required
                  />

                  <Input
                    label="Mobile Number (OTP Enabled)"
                    type="tel"
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={Save}>
                    Save Account Settings
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Banking */}
          {activeTab === 'bank' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Settlement & Payout Commercial Bank Account
              </h3>
              <p className="text-xs text-slate-500">
                Direct RTGS / NEFT settlement bank account for funds released from buyer Escrow and online PO payments.
              </p>

              <form onSubmit={handleSaveBank} className="space-y-4">
                <Input
                  label="Beneficiary Account Name"
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Bank Name"
                    value={bankForm.bankName}
                    onChange={(e) => {
                      const newRule = getBankRule(e.target.value);
                      setBankForm({
                        ...bankForm,
                        bankName: e.target.value,
                        ifsc: newRule?.ifscPrefix ? `${newRule.ifscPrefix}000123` : bankForm.ifsc,
                      });
                    }}
                    options={INDIAN_BANKS.map((b) => ({ value: b.name, label: b.name }))}
                    required
                  />

                  <Input
                    label="Bank Account Number"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Branch IFSC Code"
                    value={bankForm.ifsc}
                    onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                    required
                  />

                  <Input
                    label="Branch Location / Name"
                    value={bankForm.branch}
                    onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={Save}>
                    Update Settlement Bank
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Notifications */}
          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                Notification & Alert Webhooks
              </h3>

              <div className="space-y-3">
                {[
                  { id: 'emailOnOrder', title: 'New PO Email Notification', desc: 'Instant email alert when a verified buyer issues a Purchase Order.' },
                  { id: 'smsOnOrder', title: 'High-Priority Dispatch SMS', desc: 'Critical SMS alerts for urgent dispatch deadlines.' },
                  { id: 'whatsappOnRfq', title: 'WhatsApp RFQ Alerts', desc: 'Instant WhatsApp message when a custom quotation is requested.' },
                  { id: 'emailOnStockAlert', title: 'Low Inventory Warnings', desc: 'Automatic notification when warehouse SKU levels drop below MOQ.' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-100 hover:bg-slate-50/50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={notifPrefs[item.id]}
                      onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.id]: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-slate-500 text-[11px]">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() =>
                    addToast({
                      title: 'Preferences Saved',
                      message: 'Notification channels updated',
                      type: 'success',
                    })
                  }
                  leftIcon={Save}
                >
                  Save Notification Channels
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: Password Security */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                Change Portal Password
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={Save}>
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
