import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Check,
  CreditCard,
  MapPin,
  HelpCircle,
  KeyRound,
  Shield,
} from 'lucide-react';
import {
  step1PersonalSchema,
  step2BusinessSchema,
  step3BankSchema,
  step4DocumentsSchema,
} from '../../validations/auth.schema';
import {
  INDIAN_BANKS,
  getBankRule,
  validateBankAccountNumber,
  maskAccountNumber,
} from '../../constants/banks';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { BrandLogo } from '../../components/common/BrandLogo';
import { sellerOnboardingService, extractApiErrorMessage, mapBackendErrorToFieldErrors } from '../../services/sellerOnboarding.service';
import { authService } from '../../services/authService';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../firebase/firebaseConfig';
import apiClient from '../../api/apiClient';
import { db } from '../../mock/db.js';

const BUSINESS_TYPES = [
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'DEALER', label: 'Dealer' },
  { value: 'CONTRACTOR_FABRICATOR', label: 'Contractor / Fabricator' },
  { value: 'OTHER', label: 'Other' },
];

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi NCR',
];

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerSeller, isLoading, onboardingSellerId, setOnboardingSellerId } = useAuthStore();
  const addToast = useUIStore((state) => state.addToast);

  const initialMobile = location.state?.verifiedMobile || '';

  // 5 Steps: 1 (Personal KYC & Credentials) | 2 (Business & Tax) | 3 (Bank & Settlement) | 4 (Documents) | 5 (Success)
  const [currentStep, setCurrentStep] = useState(1);
  const [sellerId, setSellerId] = useState(onboardingSellerId || '');
  const [stepLoading, setStepLoading] = useState(null);
  const [onboardingSummary, setOnboardingSummary] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: initialMobile,
    email: '',
    aadhaarNumber: '',
    panCardNumber: '',
    password: '',
    confirmPassword: '',
    panCardImage: null,
    companyName: '',
    businessType: 'DISTRIBUTOR',
    gstin: '',
    businessAddress: '',
    state: 'Maharashtra',
    city: 'Mumbai',
    pincode: '',
    bankName: 'HDFC Bank',
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    accountType: 'CURRENT',
    termsAgreed: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const fileInputRef = useRef(null);

  // Active bank validation metadata
  const currentBankRule = getBankRule(formData.bankName);

  // Password strength calculator
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-slate-200', width: 'w-0' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
    if (score === 2) return { score: 2, text: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
    if (score === 3) return { score: 3, text: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { score: 4, text: 'Strong (Uppercase + Number + Special Char)', color: 'bg-emerald-500', width: 'w-full' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Focus helper on first error
  const focusFirstError = (errMap) => {
    setTimeout(() => {
      const firstField = Object.keys(errMap)[0];
      if (firstField) {
        const el = document.querySelector(`[name="${firstField}"]`) || document.querySelector(`input[data-field="${firstField}"]`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 50);
  };

  // Handle Text Field Changes
  const handleInputChange = (field, value) => {
    let formattedVal = value;

    if (field === 'fullName' || field === 'accountHolderName') {
      formattedVal = value.replace(/[^A-Za-z ]/g, '');
    } else if (field === 'mobileNumber') {
      formattedVal = value.replace(/\D/g, '').slice(0, 10);
    } else if (field === 'aadhaarNumber') {
      formattedVal = value.replace(/\D/g, '').slice(0, 12);
    } else if (field === 'pincode') {
      formattedVal = value.replace(/\D/g, '').slice(0, 6);
    } else if (field === 'accountNumber' || field === 'confirmAccountNumber') {
      const activeRule = getBankRule(formData.bankName);
      formattedVal = value.replace(/\D/g, '').slice(0, activeRule.maxLength);
    } else if (field === 'panCardNumber') {
      formattedVal = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else if (field === 'gstin') {
      formattedVal = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    } else if (field === 'ifscCode') {
      formattedVal = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    }

    // When bank changes, re-validate account number against new bank length
    if (field === 'bankName') {
      const newBankRule = getBankRule(value);
      setFormData((prev) => {
        const truncatedAccount = prev.accountNumber.slice(0, newBankRule.maxLength);
        const truncatedConfirm = prev.confirmAccountNumber.slice(0, newBankRule.maxLength);
        return {
          ...prev,
          bankName: value,
          accountNumber: truncatedAccount,
          confirmAccountNumber: truncatedConfirm,
        };
      });

      if (formData.accountNumber) {
        const valRes = validateBankAccountNumber(value, formData.accountNumber.slice(0, newBankRule.maxLength));
        setFieldErrors((prev) => ({
          ...prev,
          accountNumber: valRes.isValid ? undefined : valRes.error,
        }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: formattedVal }));

    // Real-time error clearing & dynamic validation
    if (field === 'accountNumber') {
      const valRes = validateBankAccountNumber(formData.bankName, formattedVal);
      setFieldErrors((prev) => ({
        ...prev,
        accountNumber: valRes.isValid ? undefined : valRes.error,
        confirmAccountNumber:
          formData.confirmAccountNumber && formattedVal !== formData.confirmAccountNumber
            ? 'Account numbers do not match.'
            : undefined,
      }));
    } else if (field === 'confirmAccountNumber') {
      setFieldErrors((prev) => ({
        ...prev,
        confirmAccountNumber:
          formattedVal !== formData.accountNumber ? 'Account numbers do not match.' : undefined,
      }));
    } else if (field === 'confirmPassword') {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword:
          formattedVal !== formData.password ? 'Passwords do not match.' : undefined,
      }));
    } else if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        message: 'PAN Card document must be smaller than 10MB.',
        type: 'error',
      });
      return;
    }

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(file.name);
    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    const fileData = {
      file,
      name: file.name,
      size: sizeFormatted,
      type: file.type || 'image/jpeg',
      previewUrl: isImage ? URL.createObjectURL(file) : null,
    };

    setFormData((prev) => ({ ...prev, panCardImage: fileData }));
    if (fieldErrors.panCardImage) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.panCardImage;
        return next;
      });
    }
  };

  const handleRemoveFile = (e) => {
    e?.stopPropagation();
    setFormData((prev) => ({ ...prev, panCardImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 1 Validation (Personal KYC & Password)
  const validateStep1 = () => {
    const res = step1PersonalSchema.safeParse({
      fullName: formData.fullName,
      mobileNumber: formData.mobileNumber,
      email: formData.email,
      aadhaarNumber: formData.aadhaarNumber,
      panCardNumber: formData.panCardNumber,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      panCardImage: formData.panCardImage,
    });

    if (!res.success) {
      const errMap = {};
      res.error.issues.forEach((issue) => {
        errMap[issue.path[0]] = issue.message;
      });
      setFieldErrors(errMap);
      focusFirstError(errMap);
      const firstMessage = Object.values(errMap)[0] || 'Please review your entries on Step 1.';
      addToast({
        title: 'Step 1 Incomplete',
        message: firstMessage,
        type: 'warning',
      });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  // Step 2 Validation (Business & Tax)
  const validateStep2 = () => {
    const res = step2BusinessSchema.safeParse({
      companyName: formData.companyName,
      businessType: formData.businessType,
      gstin: formData.gstin,
      businessAddress: formData.businessAddress,
      state: formData.state,
      city: formData.city,
      pincode: formData.pincode,
    });

    if (!res.success) {
      const errMap = {};
      res.error.issues.forEach((issue) => {
        errMap[issue.path[0]] = issue.message;
      });
      setFieldErrors(errMap);
      focusFirstError(errMap);
      const firstMessage = Object.values(errMap)[0] || 'Please review your entries on Step 2.';
      addToast({
        title: 'Step 2 Incomplete',
        message: firstMessage,
        type: 'warning',
      });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  // Step 3 Validation (Bank Settlement)
  const validateStep3 = () => {
    const res = step3BankSchema.safeParse({
      bankName: formData.bankName,
      accountHolderName: formData.accountHolderName,
      accountNumber: formData.accountNumber,
      confirmAccountNumber: formData.confirmAccountNumber,
      ifscCode: formData.ifscCode,
      accountType: formData.accountType,
    });

    if (!res.success) {
      const errMap = {};
      res.error.issues.forEach((issue) => {
        errMap[issue.path[0]] = issue.message;
      });
      setFieldErrors(errMap);
      focusFirstError(errMap);
      const firstMessage = Object.values(errMap)[0] || 'Please review your bank details.';
      addToast({
        title: 'Step 3 Incomplete',
        message: firstMessage,
        type: 'warning',
      });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  // Step 4 Validation (Documents / Terms)
  const validateStep4 = () => {
    const res = step4DocumentsSchema.safeParse({
      termsAgreed: formData.termsAgreed,
    });

    if (!res.success) {
      const errMap = {};
      res.error.issues.forEach((issue) => {
        errMap[issue.path[0]] = issue.message;
      });
      setFieldErrors(errMap);
      focusFirstError(errMap);
      const firstMessage = Object.values(errMap)[0] || 'Please accept terms & conditions.';
      addToast({
        title: 'Terms Required',
        message: firstMessage,
        type: 'warning',
      });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  // Stepper Navigation Handlers
  const handleStep1Next = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateStep1()) return;

    setStepLoading(1);
    const cleanMobile = String(formData.mobileNumber || '').replace(/\D/g, '').slice(-10);
    try {
      // 1. Register or Authenticate with Firebase
      let firebaseUser = null;
      if (auth && formData.email && formData.password) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
          firebaseUser = userCredential.user;
        } catch (fbErr) {
          if (fbErr.code === 'auth/email-already-in-use') {
            try {
              // Sign in existing user smoothly
              const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
              firebaseUser = userCredential.user;
            } catch (loginErr) {
              console.warn('Sign-in with existing user notice:', loginErr.message);
              if (loginErr.code === 'auth/wrong-password') {
                throw new Error('This email is already registered with a different password. Please sign in or use a different email.');
              }
            }
          } else {
            console.warn('Firebase user creation notice:', fbErr.message);
          }
        }
      }

      // 2. Synchronize user with Spring Boot backend
      let syncedSellerId = null;
      if (firebaseUser && typeof firebaseUser.getIdToken === 'function') {
        try {
          const token = await firebaseUser.getIdToken();
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const syncRes = await apiClient.post(
            '/api/auth/sync',
            {
              name: formData.fullName,
              phone: formData.mobileNumber,
              email: formData.email,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).catch((syncErr) => {
            // Silently absorb 409 Conflict as user is already synced
            if (syncErr.response?.status !== 409) {
              console.warn('Sync notice:', syncErr.message);
            }
            return syncErr.response;
          });
          syncedSellerId = syncRes?.data?.data?.sellerId || null;
        } catch (_) {}
      }

      // 3. Submit Step 1: Personal & KYC with PAN file to live backend
      const res = await sellerOnboardingService.submitPersonalKyc({
        name: formData.fullName,
        fullName: formData.fullName,
        phone: formData.mobileNumber,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panCardNumber,
        panCardNumber: formData.panCardNumber,
        panCardFile: formData.panCardImage?.file || formData.panCardImage,
        panCardImage: formData.panCardImage,
      });

      const newSellerId = res.sellerId || res.data?.sellerId || syncedSellerId;
      if (!newSellerId) {
        throw new Error('Backend failed to assign a seller ID. Please check server status.');
      }
      setSellerId(newSellerId);
      setOnboardingSellerId(newSellerId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('sellerId', String(newSellerId));
      }
      apiClient.defaults.headers.common['X-Seller-Id'] = String(newSellerId);

      // Ensure newly registered seller starts with completely clean 0 products
      db.clearSellerProducts(newSellerId);
      db.clearSellerCategories(newSellerId);
      db.clearSellerSubcategories(newSellerId);
      db.clearSellerBrands(newSellerId);

      db.updateSeller({
        id: newSellerId,
        sellerId: newSellerId,
        name: formData.fullName,
        fullName: formData.fullName,
        phone: `+91 ${cleanMobile}`,
        mobile: cleanMobile,
        email: formData.email,
        companyEmail: formData.email,
        password: formData.password,
        legal: {
          pan: formData.panCardNumber,
          aadhaar: formData.aadhaarNumber,
        },
      });

      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Step 1 submission error:', err);
      const backendFieldErrors = mapBackendErrorToFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        focusFirstError(backendFieldErrors);
      }
      addToast({
        title: 'Step 1 Error',
        message: extractApiErrorMessage(err, 'Failed to save personal KYC details. Please check your data and retry.'),
        type: 'error',
      });
    } finally {
      setStepLoading(null);
    }
  };

  const handleStep2Next = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setStepLoading(2);
    try {
      const cleanMobile = String(formData.mobileNumber).replace(/\D/g, '').slice(-10);
      const activeSellerId = sellerId || onboardingSellerId || (cleanMobile ? cleanMobile : 1);
      await sellerOnboardingService.submitBusinessDetails(activeSellerId, {
        companyName: formData.companyName,
        businessType: formData.businessType,
        gstin: formData.gstin,
        businessAddress: formData.businessAddress,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
      });

      db.updateSeller({
        companyName: formData.companyName,
        businessType: formData.businessType,
        address: {
          completeAddress: formData.businessAddress,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
        },
        legal: {
          ...db.getSeller()?.legal,
          gstin: formData.gstin,
        },
      });

      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const backendFieldErrors = mapBackendErrorToFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        focusFirstError(backendFieldErrors);
      }
      addToast({
        title: 'Step 2 Error',
        message: extractApiErrorMessage(err, 'Failed to save business & tax details. Please review your entries.'),
        type: 'error',
      });
    } finally {
      setStepLoading(null);
    }
  };

  const handleStep3Next = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setStepLoading(3);
    try {
      const cleanMobile = String(formData.mobileNumber).replace(/\D/g, '').slice(-10);
      const rawBank = String(formData.bankName || 'State Bank of India');
      const cleanBankName = rawBank
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/[^a-zA-Z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || 'State Bank of India';
      const rawType = String(formData.accountType || 'CURRENT').toUpperCase();
      const cleanAccountType = rawType.includes('SAVING') ? 'SAVINGS' : 'CURRENT';
      const activeSellerId = sellerId || onboardingSellerId || (cleanMobile ? cleanMobile : 1);

      await sellerOnboardingService.submitBankDetails(activeSellerId, {
        bankName: cleanBankName,
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        confirmAccountNumber: formData.confirmAccountNumber,
        ifscCode: formData.ifscCode,
        accountType: cleanAccountType,
      });

      db.updateSeller({
        bankDetails: {
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifscCode,
          ifscCode: formData.ifscCode,
          accountType: formData.accountType,
        },
      });

      // Fetch summary to prepare for Step 4
      if (activeSellerId) {
        try {
          const summaryRes = await sellerOnboardingService.getOnboardingSummary(activeSellerId);
          if (summaryRes?.data) {
            setOnboardingSummary(summaryRes.data);
          }
        } catch (err) {
          console.warn('Could not preload summary:', err.message);
        }
      }

      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const backendFieldErrors = mapBackendErrorToFieldErrors(err);
      if (Object.keys(backendFieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        focusFirstError(backendFieldErrors);
      }
      addToast({
        title: 'Step 3 Error',
        message: extractApiErrorMessage(err, 'Failed to save bank settlement details.'),
        type: 'error',
      });
    } finally {
      setStepLoading(null);
    }
  };

  // Final Submit Handler (Step 4 -> Step 5)
  const handleFinalSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) {
      addToast({
        title: 'Incomplete Details',
        message: 'Please complete all required fields correctly before submitting.',
        type: 'error',
      });
      return;
    }

    setStepLoading(4);
    try {
      const cleanMobile = String(formData.mobileNumber).replace(/\D/g, '').slice(-10);
      const activeSellerId = sellerId || onboardingSellerId || (cleanMobile ? cleanMobile : 1);

      // Submit for admin review: POST /api/seller/onboarding/{sellerId}/final-submit
      if (activeSellerId) {
        await sellerOnboardingService.finalSubmit(activeSellerId, {
          termsAgreed: formData.termsAgreed,
          submissionTimestamp: new Date().toISOString(),
        });
      }

      // Establish authenticated session
      await registerSeller(formData);
      setCurrentStep(5); // Success Step

      addToast({
        title: 'Submitted for Review',
        message: 'Your seller onboarding has been submitted for admin verification.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Submission Error',
        message: extractApiErrorMessage(err, 'Failed to complete registration. Please check your data.'),
        type: 'error',
      });
    } finally {
      setStepLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <BrandLogo size="login" theme="light" to="/" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Seller Business Registration
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Join India's leading B2B Construction & Building Materials Marketplace
          </p>
        </div>

        {/* STEPPER PROGRESS BAR */}
        {currentStep <= 4 && (
          <div className="mb-8 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center text-xs font-bold">
              {[
                { step: 1, label: '1. Personal' },
                { step: 2, label: '2. Business & Tax' },
                { step: 3, label: '3. Bank & Settlement' },
                { step: 4, label: '4. Documents' },
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isCompleted = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    disabled={s.step > currentStep}
                    onClick={() => {
                      if (s.step < currentStep) setCurrentStep(s.step);
                    }}
                    className={`py-2 px-1 sm:px-2 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black'
                        : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isCompleted && <Check className="w-3.5 h-3.5" />}
                      <span className="truncate">{s.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-200">
          
          {/* ========================================================================= */}
          {/* STEP 1: PERSONAL & KYC DETAILS + FIREBASE CREDENTIALS */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">1. Personal KYC & Credentials</h3>
                  <p className="text-xs text-slate-500">Authorized signatory identity and portal access password</p>
                </div>
                <span className="text-[11px] text-orange-600 font-bold">* Required Fields</span>
              </div>

              {/* 1. Authorized Signatory Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Signatory Name <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="e.g. Rajesh Kumar Patel"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.fullName
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* 2. Official Email & Mobile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Business Email <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="rajesh@patelsteels.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                        fieldErrors.email
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-orange-500">*</span>
                  </label>
                  <div
                    className={`flex items-center rounded-xl overflow-hidden border bg-white transition-all shadow-2xs ${
                      fieldErrors.mobileNumber
                        ? 'border-rose-500 ring-2 ring-rose-500/20'
                        : 'border-slate-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20'
                    }`}
                  >
                    <span className="px-3 py-2.5 text-xs font-bold bg-slate-100 border-r border-slate-200 text-slate-700 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      name="mobileNumber"
                      maxLength={10}
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      disabled={Boolean(initialMobile)}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      className="w-full px-3 py-2.5 text-xs sm:text-sm bg-transparent font-medium text-slate-900 focus:outline-none disabled:bg-slate-50"
                    />
                  </div>
                  {fieldErrors.mobileNumber && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.mobileNumber}</p>
                  )}
                </div>
              </div>

              {/* 3. PAN & Aadhaar Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Permanent Account Number (PAN) <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="panCardNumber"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={formData.panCardNumber}
                    onChange={(e) => handleInputChange('panCardNumber', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.panCardNumber
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.panCardNumber && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.panCardNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Aadhaar Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    maxLength={12}
                    placeholder="123456789012"
                    value={formData.aadhaarNumber}
                    onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.aadhaarNumber
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.aadhaarNumber && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.aadhaarNumber}</p>
                  )}
                </div>
              </div>

              {/* 4. Password & Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                        fieldErrors.password
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                        fieldErrors.confirmPassword
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600">Password Strength:</span>
                    <span className="text-slate-900">{passwordStrength.text}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength.color} ${passwordStrength.width} transition-all duration-300 rounded-full`} />
                  </div>
                </div>
              )}

              {/* 5. Upload PAN Card Document */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload PAN Card Document (Max 10MB) <span className="text-orange-500">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors shadow-2xs ${
                    fieldErrors.panCardImage
                      ? 'border-rose-500 bg-rose-50'
                      : formData.panCardImage
                      ? 'border-emerald-500/60 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-emerald-500/60 hover:bg-emerald-50/20 bg-slate-50/70'
                  }`}
                >
                  {formData.panCardImage ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                            {formData.panCardImage.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {formData.panCardImage.size} • Attached
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-slate-700">
                        Click to upload PAN Card (JPG, PNG, PDF)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  )}
                </div>
                {fieldErrors.panCardImage && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.panCardImage}</p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>

                <button
                  type="submit"
                  disabled={stepLoading === 1}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {stepLoading === 1 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving & Validating...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Business & Tax Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: BUSINESS & TAX DETAILS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">2. Business & Tax Details</h3>
                  <p className="text-xs text-slate-500">Enterprise entity, location and GSTIN compliance</p>
                </div>
                <span className="text-[11px] text-orange-600 font-bold">* Required Fields</span>
              </div>

              {/* 1. Company Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business / Company Name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  placeholder="e.g. Apex Steel & Building Materials Pvt Ltd"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                    fieldErrors.companyName
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {fieldErrors.companyName && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.companyName}</p>
                )}
              </div>

              {/* 2. Business Type & GSTIN Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Type <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t.value} value={t.value} className="bg-white text-slate-900">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    GSTIN (15-character GST Number) <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    maxLength={15}
                    placeholder="27ABCDE1234F1Z5"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.gstin
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.gstin && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.gstin}</p>
                  )}
                </div>
              </div>

              {/* 3. Business Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Complete Registered Business Address <span className="text-orange-500">*</span>
                </label>
                <textarea
                  name="businessAddress"
                  rows={2}
                  placeholder="Plot / Shed No, Industrial Estate, Highway Rd"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs resize-none ${
                    fieldErrors.businessAddress
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {fieldErrors.businessAddress && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.businessAddress}</p>
                )}
              </div>

              {/* 4. State, City, Pincode Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.city
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pincode <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    placeholder="400001"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.pincode
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.pincode && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.pincode}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={stepLoading === 2}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {stepLoading === 2 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Details...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Bank Settlement</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: BANK & SETTLEMENT DETAILS */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Next} className="space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">3. Bank Account & Settlement</h3>
                  <p className="text-xs text-slate-500">Commercial account for order payout settlements</p>
                </div>
                <span className="text-[11px] text-orange-600 font-bold">* Required Fields</span>
              </div>

              {/* 1. Bank Name & Account Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                  >
                    {INDIAN_BANKS.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Type <span className="text-orange-500">*</span>
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="CURRENT">Current Account (Business Recommended)</option>
                    <option value="SAVINGS">Savings Account (Sole Proprietor)</option>
                  </select>
                </div>
              </div>

              {/* 2. Account Holder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Holder Name (As per Bank Records) <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  placeholder="e.g. Apex Steel & Building Materials Pvt Ltd"
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                    fieldErrors.accountHolderName
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {fieldErrors.accountHolderName && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.accountHolderName}</p>
                )}
              </div>

              {/* 3. Account Number & Confirm Account Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Account Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    maxLength={currentBankRule.maxLength}
                    placeholder="e.g. 50200012345678"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.accountNumber
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.accountNumber && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.accountNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Account Number <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="confirmAccountNumber"
                    maxLength={currentBankRule.maxLength}
                    placeholder="Re-enter Account Number"
                    value={formData.confirmAccountNumber}
                    onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                      fieldErrors.confirmAccountNumber
                        ? 'border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {fieldErrors.confirmAccountNumber && (
                    <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.confirmAccountNumber}</p>
                  )}
                </div>
              </div>

              {/* 4. IFSC Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank IFSC Code (11 alphanumeric characters) <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  maxLength={11}
                  placeholder="e.g. HDFC0001234"
                  value={formData.ifscCode}
                  onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border rounded-xl font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
                    fieldErrors.ifscCode
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {fieldErrors.ifscCode && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.ifscCode}</p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={stepLoading === 3}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {stepLoading === 3 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Saving Settlement...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Compliance & Submit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: STATUTORY DOCUMENTS & FINAL SUBMIT */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">4. Document Vault & Final Review</h3>
                  <p className="text-xs text-slate-500">Statutory identity documents and trade compliance agreement</p>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Ready for Review
                </span>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Authorized Signatory</p>
                  <p className="text-xs font-black text-slate-900">{formData.fullName}</p>
                  <p className="text-[11px] text-slate-600">{formData.email} • +91 {formData.mobileNumber}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Registered Enterprise</p>
                  <p className="text-xs font-black text-slate-900">{formData.companyName}</p>
                  <p className="text-[11px] text-slate-600">GSTIN: {formData.gstin} • {formData.businessType}</p>
                </div>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, termsAgreed: e.target.checked }));
                      if (fieldErrors.termsAgreed) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.termsAgreed;
                          return next;
                        });
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed font-medium">
                    I agree to HinchMart's{' '}
                    <span className="text-emerald-700 font-bold hover:underline">
                      Seller Terms of Service
                    </span>
                    ,{' '}
                    <span className="text-emerald-700 font-bold hover:underline">
                      Business Verification Policy
                    </span>
                    , and GST compliance standards.
                  </span>
                </label>
                {fieldErrors.termsAgreed && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">{fieldErrors.termsAgreed}</p>
                )}
              </div>

              {/* Compliance Notice */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-slate-700 leading-relaxed text-[11.5px]">
                  Upon clicking submit, your trade compliance status will be set to{' '}
                  <strong className="text-emerald-800">Pending Admin Review</strong>. You can immediately access the seller portal to setup your catalog and pricing.
                </p>
              </div>

              <div className="pt-3 flex items-center gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-1/3 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isLoading || stepLoading === 4}
                  className="w-2/3 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading || stepLoading === 4 ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Submitting for Review...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: REGISTRATION SUCCESSFUL */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">Registration Successful!</h2>
                <p className="text-xs text-slate-600 mt-1.5">
                  Your seller account for <strong className="text-emerald-800">{formData.companyName}</strong> has been created.
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800">
                  Verification Status: Pending Admin Review
                </div>
              </div>

              <div className="pt-4 max-w-sm mx-auto space-y-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/pending-approval')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>View Approval Status</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-slate-500">
                  Seller dashboard access will unlock once approved by HinchMart administrators.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
