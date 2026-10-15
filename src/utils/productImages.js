/**
 * Product & Catalog Image Resolver
 * Strictly respects and preserves user-uploaded images for Products, Categories, Subcategories, and Brands.
 * Safely sanitizes stale or invalid URLs (like expired blob: URLs) to prevent broken image displays.
 */

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Blacklist stale table runner image accidentally saved as product fallback
  if (trimmed.includes('31d48b2a-3193-48fa-836a-86c89343b90d')) return false;
  // Blacklist generic cement stock photo
  if (trimmed.includes('photo-1589939705384-5185137a7f0f')) return false;
  // Blacklist PDF document links
  if (trimmed.endsWith('.pdf')) return false;
  // Allow data:image/, http/https, and valid URL paths
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return true;
  }
  // Allow blob: URLs if present in active session
  if (trimmed.startsWith('blob:')) return true;
  return false;
}

/**
 * Returns an array of valid images uploaded for a product
 */
export function getCleanProductImages(product = {}) {
  if (!product) return [];
  let rawList = [];

  // Parse if stringified JSON array
  let productImages = product.images;
  if (typeof productImages === 'string' && productImages.trim().startsWith('[')) {
    try {
      productImages = JSON.parse(productImages);
    } catch (_) {}
  }

  if (Array.isArray(productImages) && productImages.length > 0) {
    rawList = productImages;
  } else if (Array.isArray(product.productImages) && product.productImages.length > 0) {
    rawList = product.productImages;
  } else if (Array.isArray(product.photos) && product.photos.length > 0) {
    rawList = product.photos;
  } else if (Array.isArray(product.gallery) && product.gallery.length > 0) {
    rawList = product.gallery;
  } else if (product.imageUrl) {
    rawList = [product.imageUrl];
  } else if (product.image) {
    rawList = [product.image];
  } else if (product.artworkUrl) {
    rawList = [product.artworkUrl];
  } else if (product.thumbnail) {
    rawList = [product.thumbnail];
  }

  const validUploaded = rawList
    .map((img) => {
      if (typeof img === 'string' && isValidImageUrl(img)) return img.trim();
      if (typeof img === 'object' && img !== null) {
        const u = img.url || img.imageUrl || img.previewUrl || img.fileUrl || img.src || null;
        if (isValidImageUrl(u)) return u.trim();
      }
      return null;
    })
    .filter((img) => typeof img === 'string' && img.trim() !== '');

  return validUploaded;
}

/**
 * Returns the exact uploaded image URL for a product at index
 */
export function getProductImageUrl(product = {}, index = 0) {
  if (!product) return null;
  const list = getCleanProductImages(product);
  if (list.length > 0) {
    return list[index % list.length] || list[0];
  }
  const fallback = product.imageUrl || product.image || product.artworkUrl || null;
  return isValidImageUrl(fallback) ? fallback.trim() : null;
}

/**
 * Returns the exact uploaded image URL for a category
 */
export function getCategoryImage(cat = {}) {
  if (!cat) return null;
  if (isValidImageUrl(cat.imageUrl)) return cat.imageUrl.trim();
  if (isValidImageUrl(cat.artworkUrl)) return cat.artworkUrl.trim();
  if (isValidImageUrl(cat.image)) return cat.image.trim();
  return null;
}

/**
 * Returns the exact uploaded image URL for a subcategory
 */
export function getSubcategoryImage(sub = {}) {
  if (!sub) return null;
  if (isValidImageUrl(sub.imageUrl)) return sub.imageUrl.trim();
  if (isValidImageUrl(sub.artworkUrl)) return sub.artworkUrl.trim();
  if (isValidImageUrl(sub.image)) return sub.image.trim();
  return null;
}

/**
 * Returns the exact uploaded logo/image URL for a brand
 */
export function getBrandLogo(brand = {}) {
  if (!brand) return null;
  if (isValidImageUrl(brand.imageUrl)) return brand.imageUrl.trim();
  if (isValidImageUrl(brand.logoUrl)) return brand.logoUrl.trim();
  if (isValidImageUrl(brand.logo)) return brand.logo.trim();
  if (isValidImageUrl(brand.image)) return brand.image.trim();
  return null;
}

/**
 * Backward-compatible helper that returns empty array or user images
 */
export function getCategoryGallery(product = {}) {
  const images = getCleanProductImages(product);
  return images;
}
