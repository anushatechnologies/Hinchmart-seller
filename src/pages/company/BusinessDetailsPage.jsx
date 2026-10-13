import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { BUSINESS_TYPES, INDIAN_STATES } from '../../constants/units';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';

export function BusinessDetailsPage() {
  const { profile, updateProfile, isUpdating } = useSellerProfile();

  const [formData, setFormData] = useState({
    companyName: profile?.companyName || '',
    businessType: profile?.businessType || 'Distributor',
    establishedYear: profile?.establishedYear || new Date().getFullYear(),
    employees: profile?.employees || '',
    website: profile?.website || '',
    companyEmail: profile?.companyEmail || '',
    businessPhone: profile?.businessPhone || '',
    description: profile?.description || '',
    minOrderValue: profile?.minOrderValue || 0,
    address: {
      country: profile?.address?.country || 'India',
      state: profile?.address?.state || '',
      district: profile?.address?.district || '',
      city: profile?.address?.city || '',
      area: profile?.address?.area || '',
      pincode: profile?.address?.pincode || '',
      completeAddress: profile?.address?.completeAddress || '',
    },
    legal: {
      gstin: profile?.legal?.gstin || '',
      pan: profile?.legal?.pan || '',
      cin: profile?.legal?.cin || '',
      tradeLicense: profile?.legal?.tradeLicense || '',
      msme: profile?.legal?.msme || '',
    },
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/company/profile">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Edit Business Entity & Legal Information
            </h1>
            <p className="text-xs text-slate-500">
              Update trade credentials, statutory tax numbers, and operating addresses
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isUpdating}
          leftIcon={Save}
        >
          Save Details
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Company Trade Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />

            <Select
              label="Business Type"
              options={BUSINESS_TYPES}
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Year Established"
              type="number"
              value={formData.establishedYear}
              onChange={(e) =>
                setFormData({ ...formData, establishedYear: Number(e.target.value) })
              }
              required
            />

            <Select
              label="Number of Employees"
              options={['1-10', '11-50', '50-100', '100-500', '500+']}
              value={formData.employees}
              onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
              required
            />

            <Input
              label="Minimum Order Value (₹)"
              type="number"
              prefix="₹"
              value={formData.minOrderValue}
              onChange={(e) =>
                setFormData({ ...formData, minOrderValue: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Official Website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />

            <Input
              label="Company Email"
              value={formData.companyEmail}
              onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
              required
            />

            <Input
              label="Business Phone"
              value={formData.businessPhone}
              onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Company Description"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        {/* Legal Identifiers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Legal & Tax Identifiers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GSTIN (15-character GST Number)"
              value={formData.legal.gstin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal: { ...formData.legal, gstin: e.target.value.toUpperCase() },
                })
              }
              required
            />

            <Input
              label="Company PAN"
              value={formData.legal.pan}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal: { ...formData.legal, pan: e.target.value.toUpperCase() },
                })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="CIN / Registration Number"
              value={formData.legal.cin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal: { ...formData.legal, cin: e.target.value },
                })
              }
            />

            <Input
              label="Trade License Number"
              value={formData.legal.tradeLicense}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal: { ...formData.legal, tradeLicense: e.target.value },
                })
              }
            />

            <Input
              label="MSME / Udyam Number"
              value={formData.legal.msme}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  legal: { ...formData.legal, msme: e.target.value },
                })
              }
            />
          </div>
        </div>

        {/* Operating Address */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Operating Headquarters Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="State"
              options={INDIAN_STATES}
              value={formData.address.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value },
                })
              }
              required
            />

            <Input
              label="District"
              value={formData.address.district}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, district: e.target.value },
                })
              }
              required
            />

            <Input
              label="City"
              value={formData.address.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value },
                })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Area / Industrial Sector"
              value={formData.address.area}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, area: e.target.value },
                })
              }
              required
            />

            <Input
              label="PIN Code"
              value={formData.address.pincode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, pincode: e.target.value },
                })
              }
              required
            />
          </div>

          <Textarea
            label="Complete Building & Street Address"
            rows={2}
            value={formData.address.completeAddress}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, completeAddress: e.target.value },
              })
            }
            required
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isUpdating} leftIcon={Save}>
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
