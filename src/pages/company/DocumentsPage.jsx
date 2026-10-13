import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowLeft,
  Plus,
  ShieldCheck,
  Info,
  CreditCard,
  Check,
  ExternalLink,
  Loader2,
  Send,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useSellerProfile } from '../../hooks/useSellerProfile.js';
import { db } from '../../mock/db.js';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

// 3 STATUTORY DOCUMENTS
const REQUIRED_DOC_TYPES = [
  {
    key: 'PAN',
    docType: 'PAN Document',
    title: 'PAN Card',
    name: 'Company PAN Card',
    subtitle: 'Permanent Account Number card issued by Income Tax Department',
    fieldLabel: 'PAN Card Number',
    uploadBtnLabel: 'Upload PAN Card',
    icon: CreditCard,
    mask: (val) => {
      if (!val) return '';
      const clean = String(val).toUpperCase().trim();
      if (clean.length < 5) return clean;
      return `${clean.slice(0, 3)}XXXX${clean.slice(-2)}`;
    },
  },
  {
    key: 'AADHAAR',
    docType: 'Aadhaar Document',
    title: 'Aadhaar Card',
    name: 'Aadhaar Card',
    subtitle: '12-digit Unique Identification document for primary authorized signatory',
    fieldLabel: 'Aadhaar Number',
    uploadBtnLabel: 'Upload Aadhaar Card',
    icon: ShieldCheck,
    mask: (val) => {
      if (!val) return '';
      const clean = String(val).replace(/\D/g, '');
      if (clean.length < 4) return clean;
      return `XXXX XXXX ${clean.slice(-4)}`;
    },
  },
  {
    key: 'GSTIN',
    apiKey: 'GST',
    docType: 'GST Certificate',
    title: 'GSTIN Registration Certificate',
    name: 'GST Registration Certificate (Form REG-06)',
    subtitle: 'Statutory GSTIN certificate with legal trading identity for B2B invoicing',
    fieldLabel: 'GSTIN (GST Number)',
    uploadBtnLabel: 'Upload GSTIN Certificate',
    icon: FileText,
    mask: (val) => {
      if (!val) return '';
      const clean = String(val).toUpperCase().trim();
      if (clean.length < 6) return clean;
      return `${clean.slice(0, 2)}XXXXXXXXXX${clean.slice(-2)}`;
    },
  },
];

export function DocumentsPage() {
  const {
    profile,
    documents = [],
    vault,
    progressText: backendProgressText,
    uploadMandatoryDocument,
    submitForVerification,
    refetchVault,
    isUploading,
    isSubmittingVerification,
    isUpdating,
  } = useSellerProfile();

  // Active uploading document key (to show inline loading spinner on the specific card)
  const [activeUploadingKey, setActiveUploadingKey] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null); // { config, doc }
  const [hasJustSubmitted, setHasJustSubmitted] = useState(false);

  // Hidden file input refs for direct single-click file picker on each card
  const fileInputRefs = {
    PAN: useRef(null),
    AADHAAR: useRef(null),
    GSTIN: useRef(null),
  };

  // Check if seller has officially submitted for review
  const isSubmittedForReview =
    hasJustSubmitted ||
    (vault?.status === 'UNDER_REVIEW' && documents?.length >= 3) ||
    (vault?.status === 'SUBMITTED' && documents?.length >= 3);

  // Resolve ONLY documents that exist in backend vault data or local storage
  const resolvedDocuments = useMemo(() => {
    return REQUIRED_DOC_TYPES.map((cfg) => {
      const doc = (documents || []).find(
        (d) =>
          d.documentType === cfg.key ||
          (cfg.key === 'GSTIN' && (d.documentType === 'GST' || d.type?.toLowerCase().includes('gst'))) ||
          d.type === cfg.docType ||
          (cfg.key === 'PAN' && (d.type?.toLowerCase().includes('pan') || d.name?.toLowerCase().includes('pan'))) ||
          (cfg.key === 'AADHAAR' && (d.type?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhar')))
      );

      const hasUploadedFile = Boolean(doc && doc.fileName && String(doc.fileName).trim() !== '' && doc.status !== 'Not Uploaded');
      const status = hasUploadedFile ? (doc.status || 'Pending') : 'Not Uploaded';

      return {
        config: cfg,
        doc: hasUploadedFile ? doc : null,
        isUploaded: hasUploadedFile,
        docNumber: doc?.documentNumber || '',
        status,
        fileName: doc?.fileName || '',
        fileSize: doc?.fileSizeFormatted || doc?.fileSize || '',
        fileUrl: doc?.fileUrl || null,
        uploadedAt: doc?.uploadedDateFormatted || doc?.uploadedAt || null,
        notes: doc?.notes || (isSubmittedForReview ? 'Submitted for statutory compliance audit & verification by Admin' : 'Document attached — Ready for review submission'),
        reviewedBy: doc?.reviewedBy || 'HinchMart Compliance Admin',
        rejectionReason: doc?.rejectionReason || null,
      };
    });
  }, [documents, vault, profile, isSubmittedForReview]);

  const uploadedCount = resolvedDocuments.filter((d) => d.isUploaded).length;
  const isAllUploaded = uploadedCount === REQUIRED_DOC_TYPES.length;
  const progressText = `${uploadedCount} of ${REQUIRED_DOC_TYPES.length} submitted`;

  // Trigger file picker when user clicks "Upload ..." or "Edit"
  const handleTriggerFilePicker = (key) => {
    if (fileInputRefs[key]?.current) {
      fileInputRefs[key].current.click();
    }
  };

  // Direct File Selected Handler: sends POST /api/seller/documents
  const handleFileSelected = async (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const apiDocType = key === 'GSTIN' ? 'GST' : key;
    setActiveUploadingKey(key);

    try {
      await uploadMandatoryDocument({
        documentType: apiDocType,
        file,
      });
      await refetchVault();
    } catch (err) {
      // Local fallback handled smoothly
    } finally {
      setActiveUploadingKey(null);
      event.target.value = '';
    }
  };

  // Remove a single uploaded document
  const handleRemoveDocument = async (config) => {
    try {
      db.saveComplianceDocument(config.docType, {
        fileName: '',
        fileUrl: '',
        status: 'Not Uploaded',
        notes: '',
      });
      await refetchVault();
    } catch (err) {
      // Quiet
    }
  };

  // Reset all uploaded documents
  const handleResetAllDocuments = async () => {
    try {
      db.resetDocuments();
      setHasJustSubmitted(false);
      await refetchVault();
    } catch (err) {
      // Quiet
    }
  };

  // Submit All Documents for Admin Review
  const handleSubmitForReview = async () => {
    if (!isAllUploaded) return;
    try {
      await submitForVerification();
      setHasJustSubmitted(true);
      await refetchVault();
    } catch (err) {
      console.error('Final submit notice:', err);
    }
  };

  // Preview Handler: Opens doc.fileUrl directly in new tab or modal
  const handleOpenPreview = (item) => {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      setPreviewDoc(item);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto font-sans pb-12">
      {/* Hidden File Inputs for PAN, Aadhaar, and GST */}
      {REQUIRED_DOC_TYPES.map((cfg) => (
        <input
          key={`input-${cfg.key}`}
          ref={fileInputRefs[cfg.key]}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFileSelected(cfg.key, e)}
        />
      ))}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link to="/seller/company/profile">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Company Document Vault & Compliance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload and manage your required seller verification documents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {uploadedCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetAllDocuments}
              leftIcon={RotateCcw}
              className="text-slate-600 hover:text-slate-800"
            >
              Reset All
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const firstUnuploaded = resolvedDocuments.find((d) => !d.isUploaded);
              handleTriggerFilePicker(firstUnuploaded ? firstUnuploaded.config.key : 'PAN');
            }}
            leftIcon={Plus}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* 2. Compact Statutory Compliance Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <p className="font-bold text-amber-950">Statutory Verification Notice</p>
          <p className="text-amber-800 leading-relaxed text-[11.5px]">
            All submitted documents are reviewed and validated by the <strong>HinchMart Compliance Admin Team</strong>. 
            Once verified or rejected by the Admin, the document status will update here automatically.
          </p>
        </div>
      </div>

      {/* 4. Required Documents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Required Documents ({resolvedDocuments.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-bold">
            {progressText}
          </span>
        </div>

        <div className="space-y-3">
          {resolvedDocuments.map((item) => {
            const { config, isUploaded, status, docNumber, fileName, fileSize, uploadedAt, notes, reviewedBy, rejectionReason } = item;
            const IconComp = config.icon;
            const isItemUploading = activeUploadingKey === config.key;

            const isPending = status === 'Pending';
            const isVerified = status === 'Verified';
            const isRejected = status === 'Rejected';

            return (
              <div
                key={config.key}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-4 sm:p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Document Icon & Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : isRejected
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : isUploaded
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Document Title & Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900">{config.title}</h3>
                        {isUploaded ? (
                          <StatusBadge status={status} />
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Not Uploaded
                          </span>
                        )}
                      </div>

                      {/* When NOT uploaded: show clean descriptive subtitle only */}
                      {!isUploaded && (
                        <p className="text-xs text-slate-500 pt-0.5">
                          {config.subtitle}
                        </p>
                      )}

                      {/* When UPLOADED: show actual document number if exists */}
                      {isUploaded && docNumber && (
                        <div className="flex items-center gap-2 text-xs pt-0.5">
                          <span className="font-semibold text-slate-500">{config.fieldLabel}:</span>
                          <span className="font-mono font-bold text-slate-900 tracking-wide bg-slate-100 px-2 py-0.5 rounded text-[11.5px]">
                            {config.mask(docNumber)}
                          </span>
                        </div>
                      )}

                      {/* When UPLOADED: show actual uploaded file name, size, and date */}
                      {isUploaded && (fileName || item.fileUrl) && (
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 pt-0.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 font-semibold truncate max-w-xs">{fileName || `${config.title.toLowerCase().replace(/\s+/g, '_')}.pdf`}</span>
                          {fileSize && (
                            <>
                              <span>•</span>
                              <span>{fileSize}</span>
                            </>
                          )}
                          {uploadedAt && (
                            <>
                              <span>•</span>
                              <span>Uploaded {formatDate(uploadedAt)}</span>
                            </>
                          )}
                        </p>
                      )}

                      {/* Verification status notes */}
                      {isUploaded && isPending && (
                        <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1 pt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {isSubmittedForReview
                              ? 'Submitted for statutory compliance audit & verification by Admin'
                              : 'Document uploaded — Click "Submit for Review" below to submit to Admin'}
                          </span>
                        </p>
                      )}

                      {isUploaded && isVerified && (
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Verified by {reviewedBy || 'HinchMart Compliance Admin'}</span>
                        </p>
                      )}

                      {isUploaded && isRejected && (
                        <p className="text-[11px] text-rose-700 font-semibold flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Rejected: {rejectionReason || 'Document could not be verified'}. Please edit and re-upload.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: [ Edit ] [ Preview ] [ Remove ] (when uploaded) OR [ Upload {Title} ] (when not uploaded) */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isItemUploading ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </span>
                    ) : isUploaded ? (
                      <>
                        {/* 1. EDIT BUTTON: Opens file picker to re-upload & overwrite */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTriggerFilePicker(config.key)}
                          leftIcon={Edit2}
                          className="font-bold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </Button>

                        {/* 2. PREVIEW BUTTON: Opens doc.fileUrl */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPreview(item)}
                          leftIcon={Eye}
                          className="font-bold text-amber-700 hover:text-amber-800 bg-amber-50/50 hover:bg-amber-100/50 border-amber-200"
                        >
                          Preview
                        </Button>

                        {/* 3. REMOVE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(config)}
                          title="Remove document"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      /* SINGLE UPLOAD BUTTON: Opens file picker */
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTriggerFilePicker(config.key)}
                        leftIcon={Upload}
                      >
                        {config.uploadBtnLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. SUBMIT ALL DOCUMENTS FOR REVIEW ACTION CARD */}
      {/* ===================================================================== */}
      <div className="pt-2">
        {isSubmittedForReview ? (
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white">Under Statutory Compliance Audit</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your documents are currently being reviewed by the HinchMart Admin team. You can edit any document if needed.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shrink-0">
              <Check className="w-3.5 h-3.5" />
              <span>Submitted for Review</span>
            </span>
          </div>
        ) : (
          <div className={`rounded-2xl p-5 border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isAllUploaded
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-900/20'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <div className="space-y-1 text-center sm:text-left">
              <h3 className={`font-extrabold text-sm sm:text-base ${isAllUploaded ? 'text-white' : 'text-slate-800'}`}>
                {isAllUploaded ? 'Ready for Compliance Submission' : `Upload All 3 Documents (${uploadedCount}/3 Uploaded)`}
              </h3>
              <p className={`text-xs ${isAllUploaded ? 'text-emerald-100 font-medium' : 'text-slate-500'}`}>
                {isAllUploaded
                  ? 'All mandatory statutory documents are attached. Click submit to send your documents to the Admin team for review.'
                  : `Please upload PAN Card, Aadhaar Card, and GSTIN Certificate above to enable final review submission.`}
              </p>
            </div>

            <Button
              variant={isAllUploaded ? 'secondary' : 'secondary'}
              size="md"
              disabled={!isAllUploaded || isSubmittingVerification}
              isLoading={isSubmittingVerification}
              onClick={handleSubmitForReview}
              leftIcon={Send}
              className={`font-black text-xs sm:text-sm px-6 shrink-0 ${
                isAllUploaded
                  ? 'bg-slate-950 text-white hover:bg-slate-900 border-slate-900 shadow-md cursor-pointer'
                  : 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              Submit for Review
            </Button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 6. PREVIEW MODAL (FALLBACK IF NO DIRECT FILE URL) */}
      {/* ===================================================================== */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.config.title}
          subtitle={`Type: ${previewDoc.config.docType} • Status: ${previewDoc.status || 'Pending'}`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              {previewDoc.fileUrl ? (
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Tab</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-400 italic">
                  Document preview is not available yet.
                </span>
              )}
              <Button variant="secondary" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      HinchMart Statutory Vault
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">B2B Compliance Verification</p>
                  </div>
                </div>
                <StatusBadge status={previewDoc.status || 'Pending'} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {previewDoc.config.fieldLabel}
                </span>
                <p className="text-base sm:text-lg font-black font-mono text-emerald-400 tracking-wider">
                  {previewDoc.config.mask(previewDoc.docNumber) || 'DOCUMENT ATTACHED'}
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  {previewDoc.config.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">File Name</span>
                  <span className="font-mono text-slate-200 font-bold truncate block">
                    {previewDoc.fileName || 'Attached Document'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Verification Authority</span>
                  <span className="text-slate-200 font-semibold block">
                    {previewDoc.reviewedBy || 'HinchMart Compliance Admin'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {previewDoc.status === 'Verified' ? (
                  <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Statutory document verified against official registry. Seller account certified.</span>
                  </p>
                ) : previewDoc.status === 'Rejected' ? (
                  <p className="text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Rejected: {previewDoc.rejectionReason || 'Document could not be verified'}. Please edit and re-upload.</span>
                  </p>
                ) : (
                  <p className="text-amber-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Document submitted for compliance audit and validation.</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DocumentsPage;
