import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportTicketService } from '../services/supportTicket.service';
import { useUIStore } from '../store/uiStore';

export const SUPPORT_QUERY_KEYS = {
  all: ['seller-support-tickets'],
  list: (filters) => ['seller-support-tickets', 'list', filters],
  detail: (id) => ['seller-support-tickets', 'detail', String(id)],
};

/**
 * Hook to list and paginate seller support tickets
 */
export function useSupportTickets(filters = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const query = useQuery({
    queryKey: SUPPORT_QUERY_KEYS.list(filters),
    queryFn: () => supportTicketService.getTickets(filters),
    staleTime: 1000 * 30, // 30s
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: (ticketData) => supportTicketService.createTicket(ticketData),
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEYS.all });
      addToast({
        title: 'Ticket Created',
        message: `Ticket #${newTicket.ticketNumber || newTicket.ticketId} created successfully. Our support desk is reviewing it.`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Ticket Creation Failed',
        message: err.message || 'Could not submit support ticket',
        type: 'error',
      });
    },
  });

  return {
    ...query,
    tickets: query.data?.tickets || [],
    pagination: query.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    createTicket: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

/**
 * Hook to view a single ticket and its message thread
 */
export function useSupportTicket(id) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const query = useQuery({
    queryKey: SUPPORT_QUERY_KEYS.detail(id),
    queryFn: () => supportTicketService.getTicketById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 15,
    refetchInterval: 15000, // Poll every 15s while viewing ticket for live replies
  });

  const addMessageMutation = useMutation({
    mutationFn: (messagePayload) => supportTicketService.addMessage(id, messagePayload),
    onSuccess: (newMessage) => {
      // Invalidate both detail and list views
      queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: SUPPORT_QUERY_KEYS.all });
      addToast({
        title: 'Reply Sent',
        message: 'Your message was added to the support thread',
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Failed to Send Reply',
        message: err.message || 'Could not send message',
        type: 'error',
      });
    },
  });

  return {
    ...query,
    ticket: query.data || null,
    messages: query.data?.messages || [],
    addMessage: addMessageMutation.mutateAsync,
    isSendingMessage: addMessageMutation.isPending,
  };
}
