import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelService } from '../services/label.service';
import { useUIStore } from '../store/uiStore';

export function useLabelHistory(params = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const query = useQuery({
    queryKey: ['labelHistory', params],
    queryFn: () => labelService.getLabelHistory(params),
  });

  const createLabelMutation = useMutation({
    mutationFn: (data) => labelService.createLabel(data),
    onSuccess: (newLabel) => {
      queryClient.invalidateQueries({ queryKey: ['labelHistory'] });
      addToast({
        title: 'Product Label Generated',
        message: `Label ${newLabel.id} recorded in history for ${newLabel.customerCompany}`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Label Generation Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => labelService.updateLabelStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['labelHistory'] });
    },
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id) => labelService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labelHistory'] });
      addToast({
        title: 'Label Record Removed',
        message: 'The label history entry was deleted successfully',
        type: 'info',
      });
    },
  });

  const deleteMultipleMutation = useMutation({
    mutationFn: (ids) => labelService.deleteMultipleLabels(ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['labelHistory'] });
      addToast({
        title: 'Labels Removed',
        message: `${variables.length} label record(s) deleted successfully`,
        type: 'info',
      });
    },
  });

  return {
    history: query.data?.data || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    createLabel: createLabelMutation.mutateAsync,
    isCreating: createLabelMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteLabel: deleteLabelMutation.mutateAsync,
    isDeleting: deleteLabelMutation.isPending,
    deleteMultipleLabels: deleteMultipleMutation.mutateAsync,
    isBulkDeleting: deleteMultipleMutation.isPending,
    refetch: query.refetch,
  };
}

export function useLabel(id) {
  const query = useQuery({
    queryKey: ['label', id],
    queryFn: () => labelService.getLabelById(id),
    enabled: Boolean(id),
  });

  return {
    label: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
