import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { useUIStore } from '../store/uiStore';

export function useInventory(filters = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore(state => state.addToast);

  const inventoryQuery = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryService.getInventory(filters),
  });

  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => inventoryService.getWarehouses(),
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ productId, adjustment }) => inventoryService.updateStock(productId, adjustment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({
        title: 'Stock Updated',
        message: `Inventory for ${data.name} updated to ${data.stock} ${data.unit}`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Stock Update Failed',
        message: err.message,
        type: 'error',
      });
    }
  });

  const createWarehouseMutation = useMutation({
    mutationFn: (whData) => inventoryService.createWarehouse(whData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      addToast({
        title: 'Warehouse Added',
        message: `${data.name} registered successfully`,
        type: 'success',
      });
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, updates }) => inventoryService.updateWarehouse(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      addToast({
        title: 'Warehouse Updated',
        message: `${data.name} details saved`,
        type: 'success',
      });
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id) => inventoryService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      addToast({
        title: 'Warehouse Deleted',
        message: 'Warehouse removed from system',
        type: 'info',
      });
    },
  });

  return {
    inventory: inventoryQuery.data || [],
    isLoadingInventory: inventoryQuery.isLoading,
    warehouses: warehousesQuery.data || [],
    isLoadingWarehouses: warehousesQuery.isLoading,
    updateStock: updateStockMutation.mutateAsync,
    createWarehouse: createWarehouseMutation.mutateAsync,
    updateWarehouse: updateWarehouseMutation.mutateAsync,
    deleteWarehouse: deleteWarehouseMutation.mutateAsync,
    isUpdatingStock: updateStockMutation.isPending,
  };
}
