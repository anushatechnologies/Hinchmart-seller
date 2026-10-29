import { apiClient, USE_MOCK_API } from './api.js';
import { db } from '../mock/db.js';
import { compressImageFile } from '../utils/imageCompressor.js';

// Helper to convert a File/Blob to a persistent Base64 Data URL
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === 'undefined') {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result || null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export const uploadService = {
  /**
   * 4.8 Upload Single Product Image
   * POST /api/images/products
   */
  async uploadProductImage(file, onProgress) {
    if (!file) throw new Error('No file provided');
    if (!USE_MOCK_API) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post('/api/images/products', formData, {
          timeout: 20000,
          onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
          },
        });
        const data = res.data?.data || res.data;
        const url = data?.fileUrl || data?.imageUrl || data?.url;
        if (url) {
          return {
            success: true,
            fileUrl: url,
            imageUrl: url,
            url,
            imageKey: data?.imageKey || data?.key,
            fileName: data?.fileName || file.name,
            fileSize: data?.fileSize || file.size,
          };
        }
      } catch (err) {
        console.warn('POST /api/images/products fallback:', err?.message);
      }
    }
    return this.uploadFile(file, onProgress, 'products');
  },

  /**
   * 4.8 Upload Multiple Product Images
   * POST /api/images/multiple
   */
  async uploadMultipleProductImages(files, onProgress) {
    if (!files || !files.length) return [];
    if (!USE_MOCK_API) {
      try {
        const formData = new FormData();
        Array.from(files).forEach((f) => formData.append('files', f));
        const res = await apiClient.post('/api/images/multiple', formData, {
          timeout: 30000,
          onUploadProgress: (e) => {
            if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
          },
        });
        const data = res.data?.data || res.data;
        if (Array.isArray(data)) return data;
        if (data?.files && Array.isArray(data.files)) return data.files;
      } catch (err) {
        console.warn('POST /api/images/multiple fallback:', err?.message);
      }
    }
    const uploaded = [];
    for (const f of files) {
      const res = await this.uploadFile(f, onProgress, 'products');
      uploaded.push(res);
    }
    return uploaded;
  },
  /**
   * 2.1 Upload Product / Brand / Store Image to AWS S3 backend
   * Endpoint: POST /api/images/upload?type=products|stores|brands|categories
   * Content-Type: multipart/form-data
   * @param {File|Blob} file
   * @param {Function} onProgress
   * @param {string} type - 'products' | 'stores' | 'brands' | 'categories' | 'documents'
   */
  async uploadFile(file, onProgress, type = 'products') {
    if (!file) throw new Error('No file provided');

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    if (file.size > maxSize) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 5MB.`);
    }

    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name || '');

    if (!USE_MOCK_API) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', type);

        // 1. Direct POST to /api/images/upload?type=<type>
        const response = await apiClient.post(`/api/images/upload?type=${type}`, formData, {
          timeout: 15000,
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          },
        });

        const data = response.data?.data || response.data;
        const imageUrl = data?.imageUrl || data?.fileUrl || data?.url;
        const key = data?.imageKey || data?.key || null;

        if (imageUrl) {
          if (onProgress) onProgress(100);
          return {
            success: true,
            fileName: file.name || data.fileName,
            fileSize: `${((file.size || data.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB`,
            url: imageUrl,
            imageUrl,
            fileUrl: imageUrl,
            key,
            isImage,
          };
        }
      } catch (err) {
        // Quiet fallback to persistent Base64 Data URL if backend upload fails or is offline
      }
    }

    // Fallback: Convert to permanent Base64 Data URL (survives page refresh & localStorage)
    let base64Url = null;
    try {
      base64Url = await compressImageFile(file, { maxDim: 1200, quality: 0.85 });
    } catch (_) {}
    if (!base64Url) {
      base64Url = await fileToBase64(file);
    }

    if (onProgress) onProgress(100);
    return {
      success: true,
      fileName: file.name,
      fileSize: `${((file.size || 0) / (1024 * 1024)).toFixed(2)} MB`,
      url: base64Url,
      imageUrl: base64Url,
      fileUrl: base64Url,
      isImage,
      isLocalPreview: true,
    };
  }
};
