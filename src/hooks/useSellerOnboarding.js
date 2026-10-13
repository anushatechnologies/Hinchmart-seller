import { useContext } from 'react';
import { SellerOnboardingContext } from '../context/SellerOnboardingContext';
import { sellerOnboardingService } from '../services/sellerOnboardingService';

/**
 * useSellerOnboarding Hook
 * Manages seller KYC registration, multi-step progress,
 * and statutory document vault uploads.
 */
export function useSellerOnboarding() {
  const context = useContext(SellerOnboardingContext);

  if (context) {
    return context;
  }

  // Standalone fallback methods if used outside provider
  return {
    sellerId: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hinchmart_onboarding_seller_id') : null,
    submitStep1: sellerOnboardingService.submitStep1PersonalKyc,
    submitStep2: sellerOnboardingService.submitStep2Business,
    submitStep3: sellerOnboardingService.submitStep3Bank,
    uploadDocument: sellerOnboardingService.uploadSellerDocument,
    fetchVault: sellerOnboardingService.getDocumentVault,
    fetchSummary: sellerOnboardingService.getOnboardingSummary,
    finalSubmit: sellerOnboardingService.finalSubmit,
  };
}

export default useSellerOnboarding;
