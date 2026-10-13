/**
 * Master Indian Scheduled Commercial Banks Metadata & Validation Rules
 * Used for dynamic, bank-aware Account Number validation and length restrictions.
 */

export const INDIAN_BANKS = [
  {
    id: 'HDFC',
    name: 'HDFC Bank',
    minLength: 14,
    maxLength: 14,
    pattern: /^[0-9]{14}$/,
    sampleFormat: '14 digits (e.g. 50100234567890)',
    helpText: 'HDFC Bank account numbers are exactly 14 digits.',
  },
  {
    id: 'ICICI',
    name: 'ICICI Bank',
    minLength: 12,
    maxLength: 12,
    pattern: /^[0-9]{12}$/,
    sampleFormat: '12 digits (e.g. 000401500123)',
    helpText: 'ICICI Bank account numbers are exactly 12 digits.',
  },
  {
    id: 'SBI',
    name: 'State Bank of India (SBI)',
    minLength: 11,
    maxLength: 17,
    pattern: /^[0-9]{11,17}$/,
    sampleFormat: '11 to 17 digits (e.g. 20012345678)',
    helpText: 'SBI account numbers are typically 11 to 17 digits.',
  },
  {
    id: 'AXIS',
    name: 'Axis Bank',
    minLength: 15,
    maxLength: 15,
    pattern: /^[0-9]{15}$/,
    sampleFormat: '15 digits (e.g. 912010023456789)',
    helpText: 'Axis Bank account numbers are exactly 15 digits.',
  },
  {
    id: 'KOTAK',
    name: 'Kotak Mahindra Bank',
    minLength: 10,
    maxLength: 10,
    pattern: /^[0-9]{10}$/,
    sampleFormat: '10 digits (e.g. 1234567890)',
    helpText: 'Kotak Mahindra Bank account numbers are exactly 10 digits.',
  },
  {
    id: 'PNB',
    name: 'Punjab National Bank (PNB)',
    minLength: 16,
    maxLength: 16,
    pattern: /^[0-9]{16}$/,
    sampleFormat: '16 digits (e.g. 0123000100123456)',
    helpText: 'PNB account numbers are exactly 16 digits.',
  },
  {
    id: 'BOB',
    name: 'Bank of Baroda',
    minLength: 10,
    maxLength: 14,
    pattern: /^[0-9]{10,14}$/,
    sampleFormat: '10 to 14 digits (e.g. 01230100012345)',
    helpText: 'Bank of Baroda account numbers are 10 to 14 digits.',
  },
  {
    id: 'CANARA',
    name: 'Canara Bank',
    minLength: 13,
    maxLength: 13,
    pattern: /^[0-9]{13}$/,
    sampleFormat: '13 digits (e.g. 0123101012345)',
    helpText: 'Canara Bank account numbers are exactly 13 digits.',
  },
  {
    id: 'UNION',
    name: 'Union Bank of India',
    minLength: 15,
    maxLength: 15,
    pattern: /^[0-9]{15}$/,
    sampleFormat: '15 digits (e.g. 301201010012345)',
    helpText: 'Union Bank of India account numbers are exactly 15 digits.',
  },
  {
    id: 'INDUSIND',
    name: 'IndusInd Bank',
    minLength: 12,
    maxLength: 13,
    pattern: /^[0-9]{12,13}$/,
    sampleFormat: '12 to 13 digits (e.g. 150012345678)',
    helpText: 'IndusInd Bank account numbers are 12 to 13 digits.',
  },
  {
    id: 'YES',
    name: 'Yes Bank',
    minLength: 15,
    maxLength: 15,
    pattern: /^[0-9]{15}$/,
    sampleFormat: '15 digits (e.g. 000190100012345)',
    helpText: 'Yes Bank account numbers are exactly 15 digits.',
  },
  {
    id: 'IDBI',
    name: 'IDBI Bank',
    minLength: 16,
    maxLength: 16,
    pattern: /^[0-9]{16}$/,
    sampleFormat: '16 digits (e.g. 0123104000123456)',
    helpText: 'IDBI Bank account numbers are exactly 16 digits.',
  },
  {
    id: 'BOI',
    name: 'Bank of India',
    minLength: 15,
    maxLength: 15,
    pattern: /^[0-9]{15}$/,
    sampleFormat: '15 digits (e.g. 001210110012345)',
    helpText: 'Bank of India account numbers are exactly 15 digits.',
  },
  {
    id: 'CENTRAL',
    name: 'Central Bank of India',
    minLength: 10,
    maxLength: 10,
    pattern: /^[0-9]{10}$/,
    sampleFormat: '10 digits (e.g. 1234567890)',
    helpText: 'Central Bank of India account numbers are exactly 10 digits.',
  },
  {
    id: 'INDIAN',
    name: 'Indian Bank',
    minLength: 9,
    maxLength: 10,
    pattern: /^[0-9]{9,10}$/,
    sampleFormat: '9 to 10 digits (e.g. 123456789)',
    helpText: 'Indian Bank account numbers are 9 to 10 digits.',
  },
  {
    id: 'FEDERAL',
    name: 'Federal Bank',
    minLength: 14,
    maxLength: 14,
    pattern: /^[0-9]{14}$/,
    sampleFormat: '14 digits (e.g. 12340100123456)',
    helpText: 'Federal Bank account numbers are exactly 14 digits.',
  },
  {
    id: 'IDFC',
    name: 'IDFC FIRST Bank',
    minLength: 11,
    maxLength: 12,
    pattern: /^[0-9]{11,12}$/,
    sampleFormat: '11 to 12 digits (e.g. 10012345678)',
    helpText: 'IDFC FIRST Bank account numbers are 11 to 12 digits.',
  },
  {
    id: 'OTHER',
    name: 'Other Scheduled / Cooperative Commercial Bank',
    minLength: 9,
    maxLength: 18,
    pattern: /^[0-9]{9,18}$/,
    sampleFormat: '9 to 18 digits',
    helpText: 'Enter a valid account number for your selected bank (9 to 18 digits).',
  },
];

/**
 * Retrieve bank configuration rule by name or ID
 */
export function getBankRule(bankName) {
  if (!bankName) return INDIAN_BANKS.find((b) => b.id === 'OTHER');
  const normalized = bankName.trim().toLowerCase();

  const found = INDIAN_BANKS.find(
    (b) =>
      b.name.toLowerCase() === normalized ||
      b.id.toLowerCase() === normalized ||
      b.name.toLowerCase().includes(normalized) ||
      normalized.includes(b.name.toLowerCase())
  );

  return found || INDIAN_BANKS.find((b) => b.id === 'OTHER');
}

/**
 * Validate Account Number against bank rule
 */
export function validateBankAccountNumber(bankName, accountNumber) {
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required.' };
  }

  const cleanNumber = String(accountNumber).trim();

  if (!/^[0-9]+$/.test(cleanNumber)) {
    return { isValid: false, error: 'Account number can contain digits only (0–9).' };
  }

  const rule = getBankRule(bankName);

  if (rule.minLength === rule.maxLength) {
    if (cleanNumber.length !== rule.minLength) {
      return {
        isValid: false,
        error: `${rule.name} requires an account number of exactly ${rule.minLength} digits (currently ${cleanNumber.length}).`,
      };
    }
  } else {
    if (cleanNumber.length < rule.minLength || cleanNumber.length > rule.maxLength) {
      return {
        isValid: false,
        error: `${rule.name} account number must be between ${rule.minLength} and ${rule.maxLength} digits.`,
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Mask sensitive bank account number for UI display (e.g. XXXXXX7890)
 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber) return '';
  const str = String(accountNumber);
  if (str.length <= 4) return str;
  const lastFour = str.slice(-4);
  return 'X'.repeat(str.length - 4) + lastFour;
}
