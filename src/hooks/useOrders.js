import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { useUIStore } from '../store/uiStore';

export function useOrders(filters = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const query = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getOrders(filters),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes, dispatchDetails }) =>
      orderService.updateOrderStatus(id, { status, notes, dispatchDetails }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', data.id] });
      addToast({
        title: 'Order Status Updated',
        message: `Order ${data.orderNumber} is now ${data.orderStatus}`,
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

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => orderService.createOrder(orderData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      addToast({
        title: 'Order Created',
        message: `Order ${data.orderNumber} created successfully`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Order Creation Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  return {
    ...query,
    orders: query.data || [],
    updateOrderStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    createOrder: createOrderMutation.mutateAsync,
    isCreatingOrder: createOrderMutation.isPending,
  };
}

export function useOrder(id) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((state) => state.addToast);

  const query = useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => orderService.getOrderById(id),
    enabled: Boolean(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, notes, dispatchDetails }) =>
      orderService.updateOrderStatus(id, { status, notes, dispatchDetails }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.setQueryData(['orders', 'detail', id], data);
      addToast({
        title: 'Order Updated',
        message: `Order ${data.orderNumber} updated to ${data.orderStatus}`,
        type: 'success',
      });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => orderService.generateInvoice(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.setQueryData(['orders', 'detail', id], data.order);
      addToast({
        title: 'Tax Invoice Generated',
        message: `Invoice ${data.invoice.invoiceNumber} has been attached to this order`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Invoice Generation Failed',
        message: err.message,
        type: 'error',
      });
    },
  });

  return {
    ...query,
    order: query.data,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
    generateInvoice: generateInvoiceMutation.mutateAsync,
    isGeneratingInvoice: generateInvoiceMutation.isPending,
  };
}
