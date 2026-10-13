/**
 * Order Status Filter & Mapping Utilities
 * Scoped to HinchMart Seller Portal Order Lifecycle
 */

export const ORDER_SUMMARY_CARDS = [
  { key: 'all', label: 'ALL ORDERS', queryValue: 'all' },
  { key: 'pending', label: 'PENDING', queryValue: 'pending' },
  { key: 'confirmed', label: 'CONFIRMED', queryValue: 'confirmed' },
  { key: 'processing', label: 'PROCESSING', queryValue: 'processing' },
  { key: 'dispatched', label: 'DISPATCHED', queryValue: 'dispatched' },
  { key: 'delivered', label: 'DELIVERED', queryValue: 'delivered' },
  { key: 'cancelled', label: 'CANCELLED', queryValue: 'cancelled' },
];

/**
 * Normalizes any query param, tab ID, or status string into a canonical filter key.
 * @param {string} rawStatus
 * @returns {string} canonical filter key
 */
export function normalizeStatusFilter(rawStatus) {
  if (!rawStatus) return 'all';
  const s = String(rawStatus).trim().toLowerCase();

  if (s === 'all') return 'all';
  if (s === 'pending' || s === 'new' || s === 'new / pending') return 'pending';
  if (s === 'confirmed') return 'confirmed';
  if (s === 'processing') return 'processing';
  if (s === 'packed / ready' || s === 'packed' || s === 'ready' || s === 'ready for dispatch') {
    return 'packed / ready';
  }
  if (s === 'dispatched') return 'dispatched';
  if (s === 'in transit' || s === 'in-transit') return 'in transit';
  if (s === 'delivered') return 'delivered';
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';

  return s;
}

/**
 * Checks if a given order matches the selected canonical status filter.
 * @param {string} orderStatus
 * @param {string} canonicalFilter
 * @returns {boolean}
 */
export function orderMatchesStatus(orderStatus, canonicalFilter) {
  if (!canonicalFilter || canonicalFilter === 'all') return true;
  const s = (orderStatus || '').toLowerCase();

  switch (canonicalFilter) {
    case 'pending':
      return s === 'pending' || s === 'new';
    case 'confirmed':
      return s === 'confirmed';
    case 'processing':
      return s === 'processing';
    case 'packed / ready':
      return ['ready for dispatch', 'packed / ready', 'packed', 'ready'].includes(s);
    case 'dispatched':
      return s === 'dispatched';
    case 'in transit':
      return s === 'in transit';
    case 'delivered':
      return s === 'delivered' || s === 'completed';
    case 'completed':
      return s === 'completed';
    case 'cancelled':
      return s === 'cancelled';
    default:
      return s === canonicalFilter;
  }
}

/**
 * Returns dynamic empty state message for the active status.
 * @param {string} canonicalFilter
 * @returns {string}
 */
export function getStatusEmptyMessage(canonicalFilter) {
  switch (canonicalFilter) {
    case 'pending':
      return 'No Pending Orders';
    case 'confirmed':
      return 'No Confirmed Orders';
    case 'processing':
      return 'No Processing Orders';
    case 'dispatched':
      return 'No Dispatched Orders';
    case 'delivered':
      return 'No Delivered Orders';
    case 'cancelled':
      return 'No Cancelled Orders';
    case 'packed / ready':
      return 'No Packed / Ready Orders';
    case 'in transit':
      return 'No In-Transit Orders';
    case 'completed':
      return 'No Completed Orders';
    default:
      return 'No Orders Found';
  }
}
