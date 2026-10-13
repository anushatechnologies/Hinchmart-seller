import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerProductService } from '../services/sellerProduct.service';
import { useUIStore } from '../store/uiStore';

export const PRODUCT_QUERY_KEYS = {
  all: ['seller-products'],
  list: (filters) => ['seller-products', 'list', filters],
  detail: (id) => ['seller-products', 'detail', id],
  suggestions: (query) => ['seller-products', 'suggestions', query],
};

export function useProducts(filters = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore(state => state.addToast);

  const query = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(filters),
    queryFn: () => sellerProductService.getSellerProducts(filters),
  });

  const createMutation = useMutation({
    mutationFn: (newProduct) => sellerProductService.createSellerProduct(newProduct),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Product Created',
        message: `${data.title || data.name} submitted successfully for review`,
        type: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Error Creating Product',
        message: error.message || 'Failed to create product',
        type: 'error',
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => sellerProductService.updateSellerProduct(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Product Updated',
        message: `${data?.title || data?.name || 'Product'} updated successfully`,
        type: 'success',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Update Failed',
        message: error.message || 'Failed to update product',
        type: 'error',
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sellerProductService.deleteSellerProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Product Deleted',
        message: 'Product was removed from your inventory',
        type: 'info',
      });
    },
    onError: (error) => {
      addToast({
        title: 'Delete Failed',
        message: error.message,
        type: 'error',
      });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => sellerProductService.archiveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Product Archived',
        message: 'Product moved to archived catalog',
        type: 'info',
      });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => sellerProductService.restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Product Restored',
        message: 'Product restored to active catalog',
        type: 'success',
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => sellerProductService.duplicateProduct(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Product Duplicated',
        message: `Created duplicate draft: ${data.title || data.name}`,
        type: 'success',
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (productsList) => sellerProductService.bulkImportProducts(productsList),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      addToast({
        title: 'Bulk Import Completed',
        message: `Successfully imported ${result.count} products`,
        type: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Import Failed',
        message: err.message,
        type: 'error',
      });
    }
  });

  return {
    ...query,
    products: query.data || [],
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    archiveProduct: archiveMutation.mutateAsync,
    restoreProduct: restoreMutation.mutateAsync,
    duplicateProduct: duplicateMutation.mutateAsync,
    bulkImport: bulkImportMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isImporting: bulkImportMutation.isPending,
  };
}

export function useProduct(id) {
  const queryClient = useQueryClient();
  const addToast = useUIStore(state => state.addToast);

  const query = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: () => sellerProductService.getSellerProductById(id),
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: (updates) => sellerProductService.updateSellerProduct(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      if (data) {
        queryClient.setQueryData(PRODUCT_QUERY_KEYS.detail(id), data);
      }
      addToast({
        title: 'Product Updated',
        message: `${data?.title || data?.name || 'Product'} saved successfully`,
        type: 'success',
      });
    },
  });

  return {
    ...query,
    product: query.data,
    updateProduct: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

export function useProductSearchSuggestions(query) {
  const queryResult = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.suggestions(query),
    queryFn: () => sellerProductService.getSearchSuggestions(query),
    enabled: Boolean(query && query.trim().length >= 1),
    staleTime: 1000 * 30, // 30 seconds
  });

  return {
    ...queryResult,
    suggestions: queryResult.data || [],
  };
}
