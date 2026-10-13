export type BusinessType = 
  | "MANUFACTURER" 
  | "DISTRIBUTOR" 
  | "WHOLESALER" 
  | "RETAILER" 
  | "DEALER" 
  | "CONTRACTOR_FABRICATOR" 
  | "OTHER";

export type OnboardingStatus = 
  | "STEP_1" 
  | "STEP_2" 
  | "STEP_3" 
  | "PENDING_REVIEW" 
  | "VERIFIED" 
  | "REJECTED";

export type VerificationStatus = 
  | "PENDING" 
  | "VERIFIED" 
  | "REJECTED" 
  | "NOT_UPLOADED";

export type DocumentType = 
  | "PAN" 
  | "AADHAAR" 
  | "GST" 
  | "CHEQUE" 
  | "TRADE_LICENSE" 
  | "OTHER";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthUserResponse {
  userId: number;
  firebaseUid: string;
  email: string;
  name: string;
  phone?: string;
  role: "CUSTOMER" | "SELLER" | "ADMIN";
  sellerId?: number | null;
  claims?: Record<string, any>;
}

export interface PersonalKycRequest {
  name: string;
  email: string;
  phone: string;
  panNumber: string;
  aadhaarNumber: string;
}

export interface BusinessTaxRequest {
  companyName: string;
  businessType: BusinessType;
  gstin: string;
  businessAddress: string;
  state: string;
  city: string;
  pincode: string;
}

export interface BankDetailsRequest {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: "SAVINGS" | "CURRENT";
}

export interface DocumentVaultItem {
  documentId: number | null;
  documentType: DocumentType;
  title: string;
  description: string;
  status: string;
  statusCode: VerificationStatus;
  isUploaded: boolean;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  fileSizeFormatted?: string | null;
  fileType?: string | null;
  uploadedAt?: string | null;
  remarks?: string | null;
}

export interface SellerDocumentVaultResponse {
  sellerId: number;
  overallStatus: string;
  totalRequired: number;
  submittedCount: number;
  verifiedCount: number;
  progressText: string;
  isAllSubmitted: boolean;
  isAllVerified: boolean;
  documents: DocumentVaultItem[];
}
