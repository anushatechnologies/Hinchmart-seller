import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '../services/quotation.service';
import { useUIStore } from '../store/uiStore';

export function useQuotations(filters = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore(state => state.addToast);

  const query = useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => quotationService.getQuotations(filters),
  });

  const createMutation = useMutation({
    mutationFn: (quotationData) => quotationService.createQuotation(quotationData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      addToast({
        title: 'Quotation Generated',
        message: `Quotation #${data.quotationNumber} has been issued`,
        type: 'success',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => quotationService.updateQuotation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      addToast({
        title: 'Quotation Saved',
        message: 'Changes updated successfully',
        type: 'success',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => quotationService.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      addToast({
        title: 'Quotation Deleted',
        message: 'Quotation removed',
        type: 'info',
      });
    },
  });

  return {
    ...query,
    quotations: query.data || [],
    createQuotation: createMutation.mutateAsync,
    updateQuotation: updateMutation.mutateAsync,
    updateQuotationStatus: ({ id, status }) => updateMutation.mutateAsync({ id, updates: { status } }),
    deleteQuotation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useQuotation(id) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['quotations', 'detail', id],
    queryFn: () => quotationService.getQuotationById(id),
    enabled: Boolean(id),
  });

  return {
    ...query,
    quotation: query.data,
  };
}
