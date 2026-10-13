import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiryService } from '../services/enquiry.service';
import { useUIStore } from '../store/uiStore';

export function useEnquiries(filters = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore(state => state.addToast);

  const query = useQuery({
    queryKey: ['enquiries', filters],
    queryFn: () => enquiryService.getEnquiries(filters),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, quotationId }) => enquiryService.updateEnquiryStatus(id, { status, quotationId }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      addToast({
        title: 'Enquiry Updated',
        message: `Status marked as ${data.status}`,
        type: 'success',
      });
    },
  });

  return {
    ...query,
    enquiries: query.data || [],
    updateEnquiryStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}
