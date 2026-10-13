import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import confetti from 'canvas-confetti';
import {
  Building2,
  MapPin,
  FileCheck2,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  HardHat,
  ShieldCheck,
  FileText,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  businessDetailsSchema,
  businessAddressSchema,
  legalDetailsSchema,
} from '../../validations/business.schema';
import { BUSINESS_TYPES, INDIAN_STATES } from '../../constants/units';
import { useSellerProfile } from '../../hooks/useSellerProfile';
import { useUIStore } from '../../store/uiStore';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Stepper } from '../../components/common/Stepper';
import { BrandLogo } from '../../components/common/BrandLogo';

const ONBOARDING_STEPS = [
  { id: 1, title: 'Company Details' },
  { id: 2, title: 'Operating Address' },
  { id: 3, title: 'Legal & GST' },
  { id: 4, title: 'Documents' },
  { id: 5, title: 'Verification Status' },
];

export function BusinessOnboardingPage() {
  const navigate = useNavigate();
  const { profile, updateProfile, submitForVerification } = useSellerProfile();
  const addToast = useUIStore((state) => state.addToast);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: profile?.companyName || '',
    businessType: profile?.businessType || 'Distributor',
    establishedYear: profile?.establishedYear || new Date().getFullYear(),
    employees: profile?.employees || '',
    website: profile?.website || '',
    companyEmail: profile?.companyEmail || '',
    businessPhone: profile?.businessPhone || '',
    description: profile?.description || '',
    country: profile?.address?.country || 'India',
    state: profile?.address?.state || '',
    district: profile?.address?.district || '',
    city: profile?.address?.city || '',
    area: profile?.address?.area || '',
    pincode: profile?.address?.pincode || '',
    completeAddress: profile?.address?.completeAddress || '',
    gstin: profile?.legal?.gstin || '',
    pan: profile?.legal?.pan || '',
    cin: profile?.legal?.cin || '',
    tradeLicense: profile?.legal?.tradeLicense || '',
    msme: profile?.legal?.msme || '',
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    gstCert: null,
    panDoc: null,
    businessCert: null,
    msmeDoc: null,
  });

  // Step 1: Company details form
  const form1 = useForm({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      companyName: formData.companyName,
      businessType: formData.businessType,
      establishedYear: formData.establishedYear,
      employees: formData.employees,
      website: formData.website,
      companyEmail: formData.companyEmail,
      businessPhone: formData.businessPhone,
      description: formData.description,
    },
  });

  // Step 2: Address form
  const form2 = useForm({
    resolver: zodResolver(businessAddressSchema),
    defaultValues: {
      country: formData.country,
      state: formData.state,
      district: formData.district,
      city: formData.city,
      area: formData.area,
      pincode: formData.pincode,
      completeAddress: formData.completeAddress,
    },
  });

  // Step 3: Legal form
  const form3 = useForm({
    resolver: zodResolver(legalDetailsSchema),
    defaultValues: {
      gstin: formData.gstin,
      pan: formData.pan,
      cin: formData.cin,
      tradeLicense: formData.tradeLicense,
      msme: formData.msme,
    },
  });

  const onStep1Submit = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  };

  const onStep3Submit = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(4);
  };

  const onStep4Submit = async () => {
    // Save all to seller profile
    await updateProfile({
      companyName: formData.companyName,
      businessType: formData.businessType,
      establishedYear: formData.establishedYear,
      employees: formData.employees,
      website: formData.website,
      companyEmail: formData.companyEmail,
      businessPhone: formData.businessPhone,
      description: formData.description,
      address: {
        country: formData.country,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        area: formData.area,
        pincode: formData.pincode,
        completeAddress: formData.completeAddress,
      },
      legal: {
        gstin: formData.gstin,
        pan: formData.pan,
        cin: formData.cin,
        tradeLicense: formData.tradeLicense,
        msme: formData.msme,
      },
      completionPercentage: 96,
    });
    setStep(5);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // confetti fallback
    }
  };

  const handleFinishOnboarding = async () => {
    await submitForVerification();
    addToast({
      title: 'Setup Completed',
      message: 'Welcome to your HinchMart Seller Portal!',
      type: 'success',
    });
    navigate('/seller/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-start py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <BrandLogo size="navbar" theme="dark" to="/" />

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>B2B Enterprise Compliance</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full mt-6">
        {/* Stepper Header */}
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 shadow-md mb-6">
          <Stepper steps={ONBOARDING_STEPS} currentStep={step} onStepClick={(s) => setStep(s)} />
        </div>

        {/* Step 1: Company Details */}
        {step === 1 && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Company Information</h3>
                <p className="text-xs text-slate-500">
                  Provide your primary business entity and operating profile
                </p>
              </div>
            </div>

            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Company / Firm Name"
                  placeholder="e.g. UltraTech Infra & Steel LLP"
                  error={form1.formState.errors.companyName?.message}
                  required
                  {...form1.register('companyName')}
                />

                <Select
                  label="Primary Business Type"
                  options={BUSINESS_TYPES}
                  error={form1.formState.errors.businessType?.message}
                  required
                  {...form1.register('businessType')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Year Established"
                  type="number"
                  placeholder="2014"
                  error={form1.formState.errors.establishedYear?.message}
                  required
                  {...form1.register('establishedYear')}
                />

                <Select
                  label="Number of Employees"
                  options={['1-10', '11-50', '50-100', '100-500', '500+']}
                  error={form1.formState.errors.employees?.message}
                  required
                  {...form1.register('employees')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Official Website"
                  type="url"
                  placeholder="https://company.com"
                  error={form1.formState.errors.website?.message}
                  {...form1.register('website')}
                />

                <Input
                  label="Company Email"
                  type="email"
                  placeholder="orders@company.com"
                  error={form1.formState.errors.companyEmail?.message}
                  required
                  {...form1.register('companyEmail')}
                />

                <Input
                  label="Business Phone / Landline"
                  type="tel"
                  placeholder="+91 22 4589 1200"
                  error={form1.formState.errors.businessPhone?.message}
                  required
                  {...form1.register('businessPhone')}
                />
              </div>

              <Textarea
                label="About Company & Capabilities"
                rows={3}
                placeholder="Briefly describe your manufacturing or distribution capabilities, materials handled, and supply chain strength..."
                error={form1.formState.errors.description?.message}
                required
                {...form1.register('description')}
              />

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="submit" variant="primary" size="lg" rightIcon={ArrowRight}>
                  Next: Operating Address
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Operating & Warehouse Address</h3>
                <p className="text-xs text-slate-500">
                  Principal place of business and dispatch location
                </p>
              </div>
            </div>

            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="State"
                  options={INDIAN_STATES}
                  error={form2.formState.errors.state?.message}
                  required
                  {...form2.register('state')}
                />

                <Input
                  label="District"
                  placeholder="Thane"
                  error={form2.formState.errors.district?.message}
                  required
                  {...form2.register('district')}
                />

                <Input
                  label="City / Town"
                  placeholder="Bhiwandi"
                  error={form2.formState.errors.city?.message}
                  required
                  {...form2.register('city')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Area / Industrial Zone"
                  placeholder="Mankoli Logistics Park"
                  error={form2.formState.errors.area?.message}
                  required
                  {...form2.register('area')}
                />

                <Input
                  label="Postal PIN Code"
                  placeholder="421302"
                  error={form2.formState.errors.pincode?.message}
                  required
                  {...form2.register('pincode')}
                />
              </div>

              <Textarea
                label="Complete Building & Street Address"
                rows={3}
                placeholder="Plot / Shed / Survey number, road, landmark..."
                error={form2.formState.errors.completeAddress?.message}
                required
                {...form2.register('completeAddress')}
              />

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(1)}
                  leftIcon={ArrowLeft}
                >
                  Back
                </Button>
                <Button type="submit" variant="primary" size="lg" rightIcon={ArrowRight}>
                  Next: Legal & GST Details
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Legal & GST */}
        {step === 3 && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Legal & Tax Identification</h3>
                <p className="text-xs text-slate-500">
                  Enter statutory taxation identifiers for B2B GST commercial invoicing
                </p>
              </div>
            </div>

            <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GSTIN (15-character GST Number)"
                  placeholder="27AABCV1234E1Z5"
                  helperText="Format: 2 digits state code + 10 alphanumeric PAN + 3 chars"
                  error={form3.formState.errors.gstin?.message}
                  required
                  {...form3.register('gstin')}
                />

                <Input
                  label="Company PAN"
                  placeholder="AABCV1234E"
                  helperText="Permanent Account Number of Business"
                  error={form3.formState.errors.pan?.message}
                  required
                  {...form3.register('pan')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="CIN / LLPIN (if applicable)"
                  placeholder="U45200MH2014LLP123456"
                  error={form3.formState.errors.cin?.message}
                  {...form3.register('cin')}
                />

                <Input
                  label="Trade License Number"
                  placeholder="BMC/TL/2026/89412"
                  error={form3.formState.errors.tradeLicense?.message}
                  {...form3.register('tradeLicense')}
                />

                <Input
                  label="MSME / Udyam Number"
                  placeholder="UDYAM-MH-33-0098762"
                  error={form3.formState.errors.msme?.message}
                  {...form3.register('msme')}
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(2)}
                  leftIcon={ArrowLeft}
                >
                  Back
                </Button>
                <Button type="submit" variant="primary" size="lg" rightIcon={ArrowRight}>
                  Next: Upload Documents
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Documents Upload */}
        {step === 4 && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Compliance Documents</h3>
                <p className="text-xs text-slate-500">
                  Upload PDF, JPG, or PNG certificates for instant verification
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'gstCert', label: 'GST Registration Certificate (REG-06)', required: true },
                { key: 'panDoc', label: 'Company PAN Card Copy', required: true },
                { key: 'businessCert', label: 'Certificate of Incorporation / Partnership Deed', required: true },
                { key: 'msmeDoc', label: 'MSME Udyam Registration', required: false },
              ].map((doc) => {
                const isUploaded = Boolean(uploadedFiles[doc.key]);
                const fileInfo = uploadedFiles[doc.key];

                return (
                  <div
                    key={doc.key}
                    className={`p-4 rounded-lg border-2 ${
                      isUploaded ? 'border-emerald-200 bg-emerald-50/30' : 'border-dashed border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {doc.label}
                          {doc.required && <span className="text-rose-500 ml-1">*</span>}
                        </span>
                        {isUploaded ? (
                          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="truncate max-w-[160px]">{fileInfo.name}</span>
                            <span className="text-[10px] text-slate-400">({fileInfo.size})</span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 mt-1">PDF or JPG up to 10MB</p>
                        )}
                      </div>

                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const f = e.target.files[0];
                              setUploadedFiles((prev) => ({
                                ...prev,
                                [doc.key]: {
                                  name: f.name,
                                  size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                                  uploaded: true,
                                },
                              }));
                            }
                          }}
                        />
                        <span className="px-2.5 py-1 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 inline-block shadow-2xs">
                          {isUploaded ? 'Replace' : 'Upload'}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setStep(3)}
                leftIcon={ArrowLeft}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={onStep4Submit}
                rightIcon={ArrowRight}
              >
                Submit for Seller Verification
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Verification Checklist & Success */}
        {step === 5 && (
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">
              Onboarding Checklist Completed!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Your business profile has been registered on HinchMart. Your verified seller credentials are ready.
            </p>

            <div className="max-w-md mx-auto my-6 bg-slate-50 border border-slate-200 rounded-lg p-4 text-left divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-700 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Mobile Phone Verified
                </span>
                <span className="font-bold text-emerald-600">✓ Done</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-700 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> Business & Warehouse Profile
                </span>
                <span className="font-bold text-emerald-600">✓ Done</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-700 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 font-bold" /> GSTIN Validated
                </span>
                <span className="font-bold text-emerald-600">✓ Done</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-700 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" /> Documents Compliance Review
                </span>
                <span className="font-semibold text-amber-600">Verified & Approved</span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleFinishOnboarding}
              rightIcon={Sparkles}
              className="px-8"
            >
              Enter HinchMart Seller Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
