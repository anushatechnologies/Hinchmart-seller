import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';

export function useCategories(options = { includeSubcategories: true }) {
  const query = useQuery({
    queryKey: ['categories', options],
    queryFn: () => categoryService.getCategories(options),
    staleTime: 1000 * 60 * 2, // 2 mins
  });

  return {
    ...query,
    categories: query.data || [],
  };
}

export function useSubcategories(categoryId) {
  const query = useQuery({
    queryKey: ['subcategories', categoryId],
    queryFn: () => categoryService.getSubcategories(categoryId),
    enabled: Boolean(categoryId && String(categoryId).trim() !== ''),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  return {
    ...query,
    subcategories: query.data || [],
  };
}

export function useAllSubcategories() {
  const query = useQuery({
    queryKey: ['allSubcategories'],
    queryFn: () => categoryService.getAllSubcategories(),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  return {
    ...query,
    subcategories: query.data || [],
  };
}

export function useBrands(subcategoryId, options = {}) {
  const query = useQuery({
    queryKey: ['brands', subcategoryId, options],
    queryFn: () => categoryService.getBrands({ subcategoryId, ...options }),
    enabled: Boolean(subcategoryId && String(subcategoryId).trim() !== ''),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  return {
    ...query,
    brands: query.data || [],
  };
}

export function useAllBrands(options = {}) {
  const query = useQuery({
    queryKey: ['allBrands', options],
    queryFn: () => categoryService.getAllBrands(),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  return {
    ...query,
    brands: query.data || [],
  };
}

export function useCategorySchema(categoryId) {
  const query = useQuery({
    queryKey: ['categories', 'schema', categoryId],
    queryFn: () => categoryService.getCategorySpecSchema(categoryId),
    enabled: Boolean(categoryId),
    staleTime: 1000 * 60 * 30,
  });

  return {
    ...query,
    specFields: query.data || [],
  };
}

