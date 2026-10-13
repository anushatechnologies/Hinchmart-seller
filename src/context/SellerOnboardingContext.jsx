import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sellerOnboardingService } from '../services/sellerOnboardingService';
import { db } from '../mock/db';

export const SellerOnboardingContext = createContext(null);

export function SellerOnboardingProvider({ children }) {
  const [sellerId, setSellerIdState] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('hinchmart_onboarding_seller_id') || null;
    }
    return null;
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [personalDetails, setPersonalDetails] = useState({});
  const [businessDetails, setBusinessDetails] = useState({});
  const [bankDetails, setBankDetails] = useState({});
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [vaultData, setVaultData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState('STEP_1');
  const [verificationStatus, setVerificationStatus] = useState('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const setSellerId = useCallback((id) => {
    if (id) {
      sessionStorage.setItem('hinchmart_onboarding_seller_id', String(id));
    } else {
      sessionStorage.removeItem('hinchmart_onboarding_seller_id');
    }
    setSellerIdState(id);
  }, []);

  /**
   * Step 1: Submit Personal KYC
   */
  const submitStep1 = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sellerOnboardingService.submitStep1PersonalKyc(data);
      const newId = res.sellerId || 45;
      setSellerId(newId);
      setPersonalDetails(data);
      setOnboardingStatus('STEP_1');
      setCurrentStep(2);
      setIsLoading(false);
      return res;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [setSellerId]);

  /**
   * Step 2: Submit Business & Tax Info
   */
  const submitStep2 = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeId = sellerId || 45;
      const res = await sellerOnboardingService.submitStep2Business(activeId, data);
      setBusinessDetails(data);
      setOnboardingStatus('STEP_2');
      setCurrentStep(3);
      setIsLoading(false);
      return res;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [sellerId]);

  /**
   * Step 3: Submit Bank Details
   */
  const submitStep3 = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeId = sellerId || 45;
      const res = await sellerOnboardingService.submitStep3Bank(activeId, data);
      setBankDetails(data);
      setOnboardingStatus('STEP_3');
      setCurrentStep(4);
      setIsLoading(false);
      return res;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [sellerId]);

  /**
   * Step 4: Upload Statutory Document
   */
  const uploadDocument = useCallback(async (documentType, file) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeId = sellerId || 45;
      const res = await sellerOnboardingService.uploadSellerDocument(activeId, documentType, file);
      setUploadedDocuments((prev) => [...prev.filter((d) => d.documentType !== documentType), res]);
      setIsLoading(false);
      return res;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [sellerId]);

  /**
   * Fetch Document Vault
   */
  const fetchVault = useCallback(async () => {
    try {
      const activeId = sellerId || 45;
      const vault = await sellerOnboardingService.getDocumentVault(activeId);
      setVaultData(vault);
      return vault;
    } catch (err) {
      console.warn('Fetch vault notice:', err.message);
      return null;
    }
  }, [sellerId]);

  /**
   * Fetch Onboarding Summary
   */
  const fetchSummary = useCallback(async () => {
    try {
      const activeId = sellerId || 45;
      const summary = await sellerOnboardingService.getOnboardingSummary(activeId);
      setSummaryData(summary);
      return summary;
    } catch (err) {
      console.warn('Fetch summary notice:', err.message);
      return null;
    }
  }, [sellerId]);

  /**
   * Step 5: Final Submission for Admin Review
   */
  const finalSubmit = useCallback(async (extraData = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeId = sellerId || 45;
      const res = await sellerOnboardingService.finalSubmit(activeId, extraData);
      setOnboardingStatus('PENDING_REVIEW');
      setVerificationStatus('PENDING');
      setCurrentStep(5);
      setIsLoading(false);
      return res;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [sellerId]);

  const value = {
    sellerId,
    setSellerId,
    currentStep,
    setCurrentStep,
    personalDetails,
    businessDetails,
    bankDetails,
    uploadedDocuments,
    vaultData,
    summaryData,
    onboardingStatus,
    verificationStatus,
    isLoading,
    error,
    submitStep1,
    submitStep2,
    submitStep3,
    uploadDocument,
    fetchVault,
    fetchSummary,
    finalSubmit,
    clearError: () => setError(null),
  };

  return <SellerOnboardingContext.Provider value={value}>{children}</SellerOnboardingContext.Provider>;
}

export function useSellerOnboardingContext() {
  const context = useContext(SellerOnboardingContext);
  if (!context) {
    throw new Error('useSellerOnboardingContext must be used within a SellerOnboardingProvider');
  }
  return context;
}
