import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Navigation,
  CheckSquare,
  XCircle,
  AlertCircle,
  UserCheck,
  Zap,
} from 'lucide-react';

/**
 * Standard Order Status constants across the entire HinchMart Seller Portal
 */
export const ORDER_STATUSES = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  READY_FOR_DISPATCH: 'Packed / Ready',
  DISPATCHED: 'Dispatched',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/**
 * Canonical order lifecycle sequence
 */
export const ORDER_LIFECYCLE_STEPS = [
  {
    status: 'New',
    label: 'New / Pending',
    shortLabel: 'Pending',
    stepNumber: 1,
    icon: Clock,
    color: 'amber',
    badgeVariant: 'warning',
    description: 'Awaiting seller review & acceptance',
  },
  {
    status: 'Confirmed',
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    stepNumber: 2,
    icon: UserCheck,
    color: 'blue',
    badgeVariant: 'info',
    description: 'Seller confirmed; inventory reserved',
  },
  {
    status: 'Processing',
    label: 'Processing',
    shortLabel: 'Processing',
    stepNumber: 3,
    icon: Zap,
    color: 'purple',
    badgeVariant: 'purple',
    description: 'Picking, quality testing & packaging in progress',
  },
  {
    status: 'Packed / Ready',
    label: 'Packed / Ready',
    shortLabel: 'Ready',
    stepNumber: 4,
    icon: Package,
    color: 'indigo',
    badgeVariant: 'indigo',
    description: 'Consignment packaged at warehouse loading bay',
  },
  {
    status: 'Dispatched',
    label: 'Dispatched',
    shortLabel: 'Dispatched',
    stepNumber: 5,
    icon: Truck,
    color: 'cyan',
    badgeVariant: 'info',
    description: 'Loaded on carrier fleet with invoice attached',
  },
  {
    status: 'In Transit',
    label: 'In Transit',
    shortLabel: 'In Transit',
    stepNumber: 6,
    icon: Navigation,
    color: 'sky',
    badgeVariant: 'info',
    description: 'Consignment in transit en route to site location',
  },
  {
    status: 'Delivered',
    label: 'Delivered',
    shortLabel: 'Delivered',
    stepNumber: 7,
    icon: CheckCircle2,
    color: 'emerald',
    badgeVariant: 'success',
    description: 'Delivered at destination project site',
  },
  {
    status: 'Completed',
    label: 'Completed',
    shortLabel: 'Completed',
    stepNumber: 8,
    icon: CheckSquare,
    color: 'emerald',
    badgeVariant: 'success',
    description: 'Proof of Delivery (POD) confirmed & order finalized',
  },
  {
    status: 'Cancelled',
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    stepNumber: 0,
    icon: XCircle,
    color: 'rose',
    badgeVariant: 'danger',
    description: 'Order voided or cancelled',
  },
];

/**
 * Valid state transitions mapping to prevent invalid state jumps
 */
export const ALLOWED_TRANSITIONS = {
  New: ['Confirmed', 'Cancelled'],
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Packed / Ready', 'Ready for Dispatch', 'Cancelled'],
  'Ready for Dispatch': ['Dispatched', 'Cancelled'],
  'Packed / Ready': ['Dispatched', 'Cancelled'],
  Dispatched: ['In Transit'],
  'In Transit': ['Delivered'],
  Delivered: ['Completed'],
  Completed: [],
  Cancelled: [],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Order Tabs Configuration for the Orders list view
 */
export const ORDER_FILTER_TABS = [
  { id: 'All', label: 'All Orders' },
  { id: 'New', label: 'New / Pending' },
  { id: 'Confirmed', label: 'Confirmed' },
  { id: 'Processing', label: 'Processing' },
  { id: 'Packed / Ready', label: 'Packed / Ready' },
  { id: 'Dispatched', label: 'Dispatched' },
  { id: 'In Transit', label: 'In Transit' },
  { id: 'Delivered', label: 'Delivered' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Cancelled', label: 'Cancelled' },
];

/**
 * Payment Statuses Configuration
 */
export const PAYMENT_STATUSES = {
  PAID: 'Paid',
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  ESCROW_SECURED: 'Escrow Secured',
  CREDIT_30_DAYS: 'Credit (30 Days)',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};
