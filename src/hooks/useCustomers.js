import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customer.service';
import { useUIStore } from '../store/uiStore';

export function useCustomers(params = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const query = useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerService.getCustomers(params),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data) => customerService.createCustomer(data),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      addToast({
        title: 'Customer Added',
        message: `${newCustomer.companyName} has been enrolled into the system`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Failed to Add Customer',
        message: err.message,
        type: 'error',
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, updates }) => customerService.updateCustomer(id, updates),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', updated.id] });
      addToast({
        title: 'Customer Updated',
        message: `${updated.companyName} information updated successfully`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Update Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => customerService.updateCustomerStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', updated.id] });
      addToast({
        title: 'Status Updated',
        message: `${updated.companyName} status set to ${updated.status}`,
        type: 'info',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Status Update Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  return {
    customers: query.data?.data || [],
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createCustomer: createCustomerMutation.mutateAsync,
    isCreating: createCustomerMutation.isPending,
    updateCustomer: updateCustomerMutation.mutateAsync,
    isUpdating: updateCustomerMutation.isPending,
    updateCustomerStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}

export function useCustomer(id) {
  const query = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getCustomerById(id),
    enabled: Boolean(id),
  });

  return {
    customer: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

export function useCustomerSearch(queryStr = '') {
  const query = useQuery({
    queryKey: ['customerSearch', queryStr],
    queryFn: () => customerService.searchCustomers(queryStr),
    staleTime: 1000 * 60, // 1 min
  });

  return {
    results: query.data || [],
    isLoading: query.isLoading,
  };
}
