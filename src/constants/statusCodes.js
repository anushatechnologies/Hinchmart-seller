export const PRODUCT_STATUS = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  OUT_OF_STOCK: 'Out of Stock',
  ARCHIVED: 'Archived',
};

export const DOCUMENT_STATUS = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const ORDER_STATUS = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY_FOR_DISPATCH: 'Ready for Dispatch',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_STATUS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  PARTIAL: 'Partial Advance',
  CREDIT_30: 'Credit (30 Days)',
  ESCROW: 'Escrow Secured',
};

export const ENQUIRY_STATUS = {
  NEW: 'New',
  RESPONDED: 'Responded',
  QUOTATION_SENT: 'Quotation Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CLOSED: 'Closed',
};

export const QUOTATION_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent to Buyer',
  VIEWED: 'Viewed',
  ACCEPTED: 'Accepted',
  REVISED: 'Revised',
  EXPIRED: 'Expired',
};

export const VERIFICATION_STATUS = {
  INCOMPLETE: 'Profile Incomplete',
  DOCUMENTS_PENDING: 'Documents Pending',
  UNDER_REVIEW: 'Under Review',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};
