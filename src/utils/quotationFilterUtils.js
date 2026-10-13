/**
 * Quotation Status Filter & Normalization Utilities
 * Centralized mapping for HinchMart Seller Portal Quotations lifecycle
 */

export const QUOTATION_SUMMARY_CARDS = [
  { key: 'draft', label: 'Drafts', subtitle: 'Unsent proposals', color: 'slate' },
  { key: 'sent', label: 'Sent / Viewed', subtitle: 'Under buyer review', color: 'blue' },
  { key: 'accepted', label: 'Accepted', subtitle: 'Ready for order', color: 'emerald' },
  { key: 'rejected', label: 'Rejected', subtitle: 'Price re-negotiation', color: 'rose' },
  { key: 'expired', label: 'Expired', subtitle: 'Past validity date', color: 'amber' },
  { key: 'all', label: 'Total Quotations', subtitle: 'Active catalog quotes', color: 'purple' },
];

export const QUOTATION_STATUS_OPTIONS = [
  { value: 'all', label: 'All Quotation Statuses' },
  { value: 'draft', label: 'Drafts' },
  { value: 'sent', label: 'Sent / Viewed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

/**
 * Checks whether a quotation is expired either by explicit status
 * or by comparing validUntil date against current time (unless accepted/converted).
 * @param {object} quotation
 * @returns {boolean}
 */
export function isQuotationExpired(quotation) {
  if (!quotation) return false;
  const status = String(quotation.status || '').trim().toLowerCase();
  if (status === 'expired') return true;
  if (['accepted', 'converted'].includes(status)) return false;
  if (!quotation.validUntil) return false;

  const expiryDate = new Date(quotation.validUntil);
  if (isNaN(expiryDate.getTime())) return false;

  // Set to end of the day in local time
  expiryDate.setHours(23, 59, 59, 999);
  return expiryDate.getTime() < Date.now();
}

/**
 * Normalizes any query param, tab key, or raw status into canonical filter key.
 * @param {string} rawStatus
 * @returns {string} canonical filter key ('all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired')
 */
export function normalizeQuotationFilter(rawStatus) {
  if (!rawStatus) return 'all';
  const s = String(rawStatus).trim().toLowerCase();

  if (s === 'all') return 'all';
  if (s === 'draft' || s === 'drafts') return 'draft';
  if (s === 'sent' || s === 'sent to buyer' || s === 'viewed' || s === 'sent_viewed' || s === 'quotation sent') {
    return 'sent';
  }
  if (s === 'accepted' || s === 'converted') return 'accepted';
  if (s === 'rejected') return 'rejected';
  if (s === 'expired') return 'expired';

  return s;
}

/**
 * Determines whether a quotation matches a given canonical status filter.
 * @param {object} quotation
 * @param {string} canonicalFilter
 * @returns {boolean}
 */
export function matchesQuotationStatus(quotation, canonicalFilter) {
  if (!quotation) return false;
  const filter = normalizeQuotationFilter(canonicalFilter);
  if (!filter || filter === 'all') return true;

  const rawStatus = String(quotation.status || '').trim().toLowerCase();

  switch (filter) {
    case 'draft':
      return rawStatus === 'draft';
    case 'sent':
      return ['sent', 'sent to buyer', 'viewed', 'quotation sent'].includes(rawStatus);
    case 'accepted':
      return ['accepted', 'converted'].includes(rawStatus);
    case 'rejected':
      return rawStatus === 'rejected';
    case 'expired':
      return rawStatus === 'expired' || isQuotationExpired(quotation);
    default:
      return rawStatus === filter;
  }
}

/**
 * Calculates live summary metric counts across all quotation records.
 * @param {Array} quotations
 * @returns {{ total: number, draft: number, sent: number, accepted: number, rejected: number, expired: number }}
 */
export function calculateQuotationMetrics(quotations = []) {
  const total = quotations.length;
  let draft = 0;
  let sent = 0;
  let accepted = 0;
  let rejected = 0;
  let expired = 0;

  quotations.forEach((q) => {
    const rawStatus = String(q.status || '').trim().toLowerCase();

    if (rawStatus === 'draft') {
      draft += 1;
    } else if (['sent', 'sent to buyer', 'viewed', 'quotation sent'].includes(rawStatus)) {
      sent += 1;
    } else if (['accepted', 'converted'].includes(rawStatus)) {
      accepted += 1;
    } else if (rawStatus === 'rejected') {
      rejected += 1;
    }

    if (rawStatus === 'expired' || isQuotationExpired(q)) {
      expired += 1;
    }
  });

  return {
    total,
    draft,
    sent,
    accepted,
    rejected,
    expired,
  };
}

/**
 * Returns human-readable label for a canonical filter.
 * @param {string} canonicalFilter
 * @returns {string}
 */
export function getQuotationFilterLabel(canonicalFilter) {
  const found = QUOTATION_STATUS_OPTIONS.find((opt) => opt.value === canonicalFilter);
  return found ? found.label : 'All';
}
