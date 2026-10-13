import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerService } from '../services/seller.service.js';
import { normalizeSellerId } from '../services/sellerOnboarding.service.js';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../mock/db.js';

export function useSellerProfile(explicitSellerId = null) {
  const queryClient = useQueryClient();
  const addToast = useUIStore(state => state.addToast);
  const user = useAuthStore(state => state.user);
  const onboardingSellerId = useAuthStore(state => state.onboardingSellerId);

  // Derive active clean numeric sellerId dynamically (defaults to 9)
  const rawSellerId =
    explicitSellerId ||
    onboardingSellerId ||
    user?.sellerId ||
    user?.id ||
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hinchmart_onboarding_seller_id') : null) ||
    (typeof localStorage !== 'undefined' ? (localStorage.getItem('hinchmart_active_seller_id') || localStorage.getItem('hinchmart_seller_id')) : null) ||
    db.getSeller()?.id ||
    '9';

  const activeSellerId = normalizeSellerId(rawSellerId);

  const profileQuery = useQuery({
    queryKey: ['seller', 'profile', activeSellerId],
    queryFn: () => sellerService.getProfile(activeSellerId),
  });

  const vaultQuery = useQuery({
    queryKey: ['seller', 'vault', activeSellerId],
    queryFn: () => sellerService.getDocumentVault(activeSellerId),
    enabled: Boolean(activeSellerId),
  });

  const documentsQuery = useQuery({
    queryKey: ['seller', 'documents', activeSellerId],
    queryFn: () => sellerService.getDocuments(activeSellerId),
    enabled: Boolean(activeSellerId),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (updates) => sellerService.updateProfile(updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Profile Updated',
        message: 'Company profile and business details saved',
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Update Failed',
        message: err.message,
        type: 'error',
      });
    }
  });

  const uploadMandatoryDocMutation = useMutation({
    mutationFn: ({ documentType, file }) =>
      sellerService.uploadMandatoryDocument(activeSellerId, documentType, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Document Uploaded',
        message: data?.message || `${data?.document?.title || 'Document'} uploaded successfully`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Upload Failed',
        message: err.message || 'Failed to upload document',
        type: 'error',
      });
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: (docData) => sellerService.uploadDocument(docData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Document Uploaded',
        message: `${data.name} submitted for compliance verification`,
        type: 'success',
      });
    },
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ id, updates }) => sellerService.updateDocument(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Document Updated',
        message: `${data?.name || 'Document'} updated successfully`,
        type: 'success',
      });
    },
  });

  const saveComplianceDocMutation = useMutation({
    mutationFn: ({ type, data }) => sellerService.saveComplianceDocument(type, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Document Saved',
        message: `${data?.name || 'Document'} saved`,
        type: 'success',
      });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id) => sellerService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      addToast({
        title: 'Document Removed',
        message: 'Document deleted from vault',
        type: 'info',
      });
    },
  });

  const approveDocMutation = useMutation({
    mutationFn: ({ id, notes }) => sellerService.approveDocument(id, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Document Verified',
        message: `${data.name || 'Document'} has been approved and verified by Admin`,
        type: 'success',
      });
    },
  });

  const rejectDocMutation = useMutation({
    mutationFn: ({ id, reason }) => sellerService.rejectDocument(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Document Rejected',
        message: `${data.name || 'Document'} was rejected. Reason: ${data.rejectionReason || 'Compliance issue'}`,
        type: 'error',
      });
    },
  });

  const approveAllDocsMutation = useMutation({
    mutationFn: () => sellerService.approveAllDocuments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'All Documents Approved',
        message: 'All compliance documents have been verified. Seller status is now Verified B2B Seller!',
        type: 'success',
      });
    },
  });

  const resetDocsMutation = useMutation({
    mutationFn: () => sellerService.resetDocuments(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      addToast({
        title: 'Documents Reset',
        message: 'Compliance documents reset to default Pending state',
        type: 'info',
      });
    },
  });

  const submitVerificationMutation = useMutation({
    mutationFn: () => sellerService.submitForVerification(activeSellerId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'vault'] });
      addToast({
        title: 'Submitted for Review',
        message: data?.message || 'All required statutory documents submitted for Admin review.',
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Submission Error',
        message: err.message || 'Failed to submit documents for review. Please try again.',
        type: 'error',
      });
    },
  });

  return {
    sellerId: activeSellerId,
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.isLoading,
    vault: vaultQuery.data,
    isLoadingVault: vaultQuery.isLoading,
    documents: vaultQuery.data?.documents || documentsQuery.data || [],
    isLoadingDocs: vaultQuery.isLoading || documentsQuery.isLoading,
    progressText: vaultQuery.data?.progressText || null,
    updateProfile: updateProfileMutation.mutateAsync,
    uploadMandatoryDocument: uploadMandatoryDocMutation.mutateAsync,
    uploadDocument: uploadDocMutation.mutateAsync,
    updateDocument: updateDocMutation.mutateAsync,
    saveComplianceDocument: saveComplianceDocMutation.mutateAsync,
    deleteDocument: deleteDocMutation.mutateAsync,
    approveDocument: approveDocMutation.mutateAsync,
    rejectDocument: rejectDocMutation.mutateAsync,
    approveAllDocs: approveAllDocsMutation.mutateAsync,
    approveAllDocuments: approveAllDocsMutation.mutateAsync,
    resetDocuments: resetDocsMutation.mutateAsync,
    submitForVerification: submitVerificationMutation.mutateAsync,
    refetchVault: vaultQuery.refetch,
    refetchDocuments: documentsQuery.refetch,
    isUploading: uploadMandatoryDocMutation.isPending,
    isSubmittingVerification: submitVerificationMutation.isPending,
    isUpdating: updateProfileMutation.isPending || approveDocMutation.isPending || approveAllDocsMutation.isPending || updateDocMutation.isPending || saveComplianceDocMutation.isPending || uploadMandatoryDocMutation.isPending || submitVerificationMutation.isPending,
  };
}
