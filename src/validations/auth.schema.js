import { z } from 'zod';
import { validateBankAccountNumber } from '../constants/banks.js';

export const mobileLoginSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(/^[0-9]{10}$/, 'Mobile number must contain exactly 10 digits.')
    .regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'),
});

export const emailLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Official business email is required')
    .email('Please enter a valid business email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, 'OTP is required')
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^[0-9]{6}$/, 'OTP must contain numbers only'),
});

export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least 1 number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character (e.g. !@#$%^&*)');

export const step1PersonalSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Authorized signatory name is required')
      .regex(/^[A-Za-z\s]{2,100}$/, 'Full name must contain 2–100 alphabetic characters and spaces only.'),

    email: z
      .string()
      .min(1, 'Official business email is required')
      .email('Please enter a valid business email address')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email cannot contain spaces'),

    mobileNumber: z
      .string()
      .min(1, 'Mobile number is required')
      .regex(/^[0-9]{10}$/, 'Mobile number must contain exactly 10 digits.')
      .regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit Indian mobile number'),

    panCardNumber: z
      .string()
      .min(1, 'PAN Card Number is required.')
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
        'Please enter a valid 10-character PAN Card number (e.g. ABCDE1234F).'
      ),

    aadhaarNumber: z
      .string()
      .min(1, 'Aadhaar number is required.')
      .regex(/^[0-9]+$/, 'Aadhaar number must contain numbers only.')
      .length(12, 'Aadhaar number must be exactly 12 numeric digits.'),

    password: passwordValidation,

    confirmPassword: z.string().min(1, 'Please confirm your password'),

    panCardImage: z.custom(
      (val) => {
        if (!val) return false;
        if (typeof val === 'string') return val.trim().length > 0;
        if (typeof val === 'object') {
          return Boolean(val.file || val.name || val.url || (val instanceof File));
        }
        return false;
      },
      {
        message: 'Please upload your PAN Card document (Max 10MB).',
      }
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const step2BusinessSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Business / Company name is required')
    .min(2, 'Company name must be at least 2 characters'),

  businessType: z
    .string()
    .min(1, 'Please select a business type'),

  gstin: z
    .string()
    .min(1, 'GSTIN is required.')
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Please enter a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).'
    ),

  businessAddress: z
    .string()
    .min(1, 'Business address is required')
    .min(5, 'Please provide full business address'),

  state: z
    .string()
    .min(1, 'State is required'),

  city: z
    .string()
    .min(1, 'City is required'),

  pincode: z
    .string()
    .min(1, 'Pincode is required')
    .regex(/^[1-9][0-9]{5}$/, 'Pincode must be exactly 6 digits'),
});

export const step3BankSchema = z
  .object({
    bankName: z
      .string()
      .min(1, 'Bank name is required')
      .min(2, 'Bank name must be at least 2 characters'),

    accountHolderName: z
      .string()
      .min(1, 'Account holder name is required')
      .regex(/^[A-Za-z ]+$/, 'Account holder name can contain only letters and spaces.')
      .min(2, 'Account holder name must be at least 2 characters'),

    accountNumber: z
      .string()
      .min(1, 'Account number is required')
      .regex(/^[0-9]{9,18}$/, 'Account number must be between 9 and 18 digits.'),

    confirmAccountNumber: z
      .string()
      .min(1, 'Please confirm your account number')
      .regex(/^[0-9]{9,18}$/, 'Account number must be between 9 and 18 digits.'),

    ifscCode: z
      .string()
      .min(1, 'IFSC code is required')
      .regex(
        /^[A-Z]{4}0[A-Z0-9]{6}$/,
        'Enter a valid 11-character IFSC code (e.g. HDFC0001234).'
      ),

    accountType: z.enum(['SAVINGS', 'CURRENT']).default('CURRENT'),
  })
  .superRefine((data, ctx) => {
    const bankVal = validateBankAccountNumber(data.bankName, data.accountNumber);
    if (!bankVal.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bankVal.error,
        path: ['accountNumber'],
      });
    }

    if (data.accountNumber !== data.confirmAccountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account numbers do not match.',
        path: ['confirmAccountNumber'],
      });
    }
  });

export const step4DocumentsSchema = z.object({
  termsAgreed: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to HinchMart's Seller Terms of Service, Business Verification Policy, and GST compliance standards.",
    }),
  }),
});

export const fullRegistrationSchema = z
  .object({
    ...step1PersonalSchema._def.schema.shape,
    ...step2BusinessSchema.shape,
    ...step3BankSchema._def.schema.shape,
    termsAgreed: z.literal(true),
  })
  .superRefine((data, ctx) => {
    const bankVal = validateBankAccountNumber(data.bankName, data.accountNumber);
    if (!bankVal.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: bankVal.error,
        path: ['accountNumber'],
      });
    }

    if (data.accountNumber !== data.confirmAccountNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Account numbers do not match.',
        path: ['confirmAccountNumber'],
      });
    }

    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter your registered business email address'),
});

export const resetPasswordSchema = z
  .object({
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
