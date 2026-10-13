/**
 * Indian Rupee formatter (e.g. ₹ 1,45,000.00)
 */
export function formatCurrency(amount, includeDecimals = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  const numeric = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(numeric);
}

/**
 * Format standard number with Indian comma grouping
 */
export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(Number(num));
}

/**
 * Date formatter (e.g. 20 Aug 2026, 11:30 AM)
 */
export function formatDate(dateString, includeTime = false) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Relative time formatter (e.g. "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return formatDate(dateString);
}

/**
 * Format GST percentage
 */
export function formatGst(rate) {
  return `${rate}% GST`;
}

/**
 * Format SKU code for display
 */
export function formatSku(sku) {
  return sku ? String(sku).toUpperCase() : '—';
}
