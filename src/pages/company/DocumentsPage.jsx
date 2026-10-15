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
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { useSellerProfile } from '../../hooks/useSellerProfile.js';
import { db } from '../../mock/db.js';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';
import {
  getStoredKycPhotos,
  saveStoredKycPhoto,
  removeStoredKycPhoto,
  readFileAsDataUrl,
  generateStatutoryPhotoUrl,
} from '../../utils/documentPhotoUtils.js';

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
    uploadMandatoryDocument,
    submitForVerification,
    refetchVault,
    isSubmittingVerification,
  } = useSellerProfile();

  // Active uploading document key (to show inline loading spinner on the specific card)
  const [activeUploadingKey, setActiveUploadingKey] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [hasJustSubmitted, setHasJustSubmitted] = useState(false);
  const [photosVersion, setPhotosVersion] = useState(0);

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

  // Resolve documents with full photo detection and statutory KYC fallbacks
  const resolvedDocuments = useMemo(() => {
    const storedPhotos = getStoredKycPhotos();
    const seller = db.getSeller ? (db.getSeller() || {}) : {};

    const sellerDisplayName =
      profile?.companyName ||
      profile?.name ||
      seller?.companyName ||
      seller?.name ||
      'Verified B2B Seller';

    // Check if seller has been verified
    const isSellerVerified = Boolean(
      profile?.verified ||
      profile?.isVerified ||
      profile?.onboardingStatus === 'VERIFIED' ||
      profile?.verificationStatus === 'Verified' ||
      profile?.verificationStatus === 'VERIFIED' ||
      seller?.verified ||
      seller?.verificationStatus === 'Verified' ||
      seller?.onboardingStatus === 'VERIFIED'
    );

    return REQUIRED_DOC_TYPES.map((cfg) => {
      // 1. Check in documents array (from vault / API / db)
      const doc = (documents || []).find(
        (d) =>
          d.documentType === cfg.key ||
          (cfg.key === 'GSTIN' && (d.documentType === 'GST' || d.type?.toLowerCase().includes('gst'))) ||
          d.type === cfg.docType ||
          (cfg.key === 'PAN' && (d.type?.toLowerCase().includes('pan') || d.name?.toLowerCase().includes('pan'))) ||
          (cfg.key === 'AADHAAR' && (d.type?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhar')))
      );

      // Direct local DB compliance check
      const localDocsList = db.getDocuments ? db.getDocuments() : [];
      const localDoc = localDocsList.find(
        (d) =>
          d.documentType === cfg.key ||
          (cfg.key === 'GSTIN' && (d.documentType === 'GST' || d.type?.toLowerCase().includes('gst'))) ||
          d.type === cfg.docType ||
          (cfg.key === 'PAN' && (d.type?.toLowerCase().includes('pan') || d.name?.toLowerCase().includes('pan'))) ||
          (cfg.key === 'AADHAAR' && (d.type?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhaar') || d.name?.toLowerCase().includes('aadhar')))
      );

      // 2. Resolve document number from doc, storedPhotos, profile, or seller
      let docNumber = doc?.documentNumber || localDoc?.documentNumber || '';
      let customPhoto = null;
      let fileName = doc?.fileName || localDoc?.fileName || '';
      let fileSize = doc?.fileSizeFormatted || doc?.fileSize || localDoc?.fileSize || '';

      if (cfg.key === 'PAN') {
        docNumber =
          docNumber ||
          storedPhotos['PAN']?.docNumber ||
          profile?.legal?.pan ||
          profile?.panCardNumber ||
          profile?.panNumber ||
          profile?.pan ||
          seller?.legal?.pan ||
          seller?.panCardNumber ||
          seller?.panNumber ||
          seller?.pan ||
          '';

        customPhoto =
          storedPhotos['PAN']?.dataUrl ||
          doc?.photoUrl ||
          doc?.fileUrl ||
          localDoc?.photoUrl ||
          localDoc?.fileUrl ||
          profile?.panCardUrl ||
          profile?.panCardImage?.dataUrl ||
          profile?.panCardImage?.previewUrl ||
          seller?.panCardImage?.dataUrl ||
          seller?.panCardImage?.previewUrl ||
          null;

        fileName = storedPhotos['PAN']?.fileName || fileName || profile?.panCardImage?.name || (docNumber ? 'pan_card.jpg' : '');
        fileSize = storedPhotos['PAN']?.fileSize || fileSize || '1.2 MB';
      } else if (cfg.key === 'AADHAAR') {
        docNumber =
          docNumber ||
          storedPhotos['AADHAAR']?.docNumber ||
          profile?.legal?.aadhaar ||
          profile?.aadhaarNumber ||
          profile?.aadhaar ||
          seller?.legal?.aadhaar ||
          seller?.aadhaarNumber ||
          seller?.aadhaar ||
          '';

        customPhoto =
          storedPhotos['AADHAAR']?.dataUrl ||
          doc?.photoUrl ||
          doc?.fileUrl ||
          localDoc?.photoUrl ||
          localDoc?.fileUrl ||
          profile?.aadhaarCardUrl ||
          profile?.aadhaarCardImage?.dataUrl ||
          profile?.aadhaarCardImage?.previewUrl ||
          seller?.aadhaarCardImage?.dataUrl ||
          seller?.aadhaarCardImage?.previewUrl ||
          null;

        fileName = storedPhotos['AADHAAR']?.fileName || fileName || profile?.aadhaarCardImage?.name || (docNumber ? 'aadhaar_card.jpg' : '');
        fileSize = storedPhotos['AADHAAR']?.fileSize || fileSize || '1.1 MB';
      } else if (cfg.key === 'GSTIN') {
        docNumber =
          docNumber ||
          storedPhotos['GSTIN']?.docNumber ||
          profile?.legal?.gstin ||
          profile?.gstin ||
          profile?.gst ||
          seller?.legal?.gstin ||
          seller?.gstin ||
          seller?.gst ||
          '';

        customPhoto =
          storedPhotos['GSTIN']?.dataUrl ||
          doc?.photoUrl ||
          doc?.fileUrl ||
          localDoc?.photoUrl ||
          localDoc?.fileUrl ||
          profile?.gstCertificateUrl ||
          profile?.gstCertificateImage?.dataUrl ||
          profile?.gstCertificateImage?.previewUrl ||
          seller?.gstCertificateImage?.dataUrl ||
          seller?.gstCertificateImage?.previewUrl ||
          null;

        fileName = storedPhotos['GSTIN']?.fileName || fileName || profile?.gstCertificateImage?.name || (docNumber ? 'gstin_certificate.pdf' : '');
        fileSize = storedPhotos['GSTIN']?.fileSize || fileSize || '1.5 MB';
      }

      // Check whether photo is custom image (dataUrl / http)
      const hasCustomPhoto = Boolean(customPhoto && String(customPhoto).trim() !== '' && !customPhoto.includes('sample.pdf'));
      const hasUploadedFile = Boolean(
        hasCustomPhoto ||
        (doc && doc.fileName && String(doc.fileName).trim() !== '' && doc.status !== 'Not Uploaded') ||
        (localDoc && (localDoc.fileName || localDoc.fileUrl || localDoc.photoUrl) && localDoc.status !== 'Not Uploaded')
      );

      // ONLY use custom photo uploaded by user - NEVER substitute a different image or mock SVG
      const photoUrl = hasCustomPhoto ? customPhoto : null;

      // Determine status
      let status = 'Not Uploaded';
      if (isSellerVerified) {
        status = 'Verified';
      } else if (doc?.status && doc.status !== 'Not Uploaded') {
        status = doc.status;
      } else if (localDoc?.status && localDoc.status !== 'Not Uploaded') {
        status = localDoc.status;
      } else if (hasUploadedFile) {
        status = 'Pending';
      }

      return {
        config: cfg,
        doc: hasUploadedFile ? doc : null,
        isUploaded: hasUploadedFile,
        hasCustomPhoto,
        photoUrl,
        docNumber,
        status,
        fileName: fileName || (hasUploadedFile ? `${cfg.title.toLowerCase().replace(/\s+/g, '_')}.jpg` : ''),
        fileSize: fileSize || '1.2 MB',
        fileUrl: photoUrl,
        uploadedAt: doc?.uploadedDateFormatted || doc?.uploadedAt || (hasUploadedFile ? new Date().toISOString() : null),
        notes: doc?.notes || (isSubmittedForReview ? 'Submitted for statutory compliance audit & verification by Admin' : 'Document attached — Ready for review submission'),
        reviewedBy: doc?.reviewedBy || 'HinchMart Compliance Admin',
        rejectionReason: doc?.rejectionReason || null,
      };
    });
  }, [documents, vault, profile, isSubmittedForReview, photosVersion]);

  const uploadedCount = resolvedDocuments.filter((d) => d.isUploaded).length;
  const isAllUploaded = uploadedCount === REQUIRED_DOC_TYPES.length;
  const progressText = `${uploadedCount} of ${REQUIRED_DOC_TYPES.length} submitted`;

  // Trigger file picker when user clicks "Upload ...", thumbnail, or "Change Photo"
  const handleTriggerFilePicker = (key) => {
    if (fileInputRefs[key]?.current) {
      fileInputRefs[key].current.click();
    }
  };

  // Direct File Selected Handler: processes user uploaded photo
  const handleFileSelected = async (key, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setActiveUploadingKey(key);

    try {
      // 1. Read as persistent Data URL so user's exact photo is immediately visible
      const photoDataUrl = await readFileAsDataUrl(file);
      const fileSizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      // 2. Persist to localStorage KYC photos store
      if (photoDataUrl) {
        saveStoredKycPhoto(key, {
          dataUrl: photoDataUrl,
          fileName: file.name,
          fileSize: fileSizeFormatted,
        });
      }

      // 3. Save to backend / onboarding service
      const apiDocType = key === 'GSTIN' ? 'GST' : key;
      await uploadMandatoryDocument({
        documentType: apiDocType,
        file,
        fileUrl: photoDataUrl,
      });

      // 4. Also sync with db mock documents vault
      const docCfg = REQUIRED_DOC_TYPES.find((c) => c.key === key);
      if (docCfg) {
        db.saveComplianceDocument(docCfg.docType, {
          fileName: file.name,
          fileSize: fileSizeFormatted,
          fileUrl: photoDataUrl,
          photoUrl: photoDataUrl,
          status: 'Pending',
          notes: 'Submitted for statutory compliance audit & verification by Admin',
        });
      }

      setPhotosVersion((prev) => prev + 1);
      await refetchVault();
    } catch (err) {
      console.warn('Document upload notice:', err);
    } finally {
      setActiveUploadingKey(null);
      event.target.value = '';
    }
  };

  // Remove a single uploaded document
  const handleRemoveDocument = async (config) => {
    try {
      removeStoredKycPhoto(config.key);
      db.saveComplianceDocument(config.docType, {
        fileName: '',
        fileUrl: '',
        photoUrl: '',
        status: 'Not Uploaded',
        notes: '',
      });
      setPhotosVersion((prev) => prev + 1);
      await refetchVault();
    } catch (err) {
      // Quiet
    }
  };

  // Reset all uploaded documents
  const handleResetAllDocuments = async () => {
    try {
      REQUIRED_DOC_TYPES.forEach((c) => removeStoredKycPhoto(c.key));
      db.resetDocuments();
      setHasJustSubmitted(false);
      setPhotosVersion((prev) => prev + 1);
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

  // Preview Handler: Opens preview modal with full-size photo
  const handleOpenPreview = (item) => {
    setPreviewDoc(item);
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
              Upload and manage your required seller verification documents and photos.
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

      {/* 2. Statutory Compliance Notice */}
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

      {/* 3. Required Documents Section */}
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
            const {
              config,
              isUploaded,
              photoUrl,
              hasCustomPhoto,
              status,
              docNumber,
              fileName,
              fileSize,
              uploadedAt,
              reviewedBy,
              rejectionReason,
            } = item;
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
                  {/* Left: Document Photo Thumbnail & Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* PHOTO THUMBNAIL */}
                    <div
                      onClick={() => {
                        if (isUploaded && photoUrl) {
                          handleOpenPreview(item);
                        } else {
                          handleTriggerFilePicker(config.key);
                        }
                      }}
                      className={`w-28 h-20 sm:w-32 sm:h-22 rounded-xl overflow-hidden border shrink-0 relative group cursor-pointer transition-all ${
                        isVerified
                          ? 'border-emerald-300 ring-1 ring-emerald-500/20 bg-emerald-50/40 shadow-xs'
                          : isUploaded
                          ? 'border-slate-300 hover:border-orange-400 bg-slate-100 shadow-xs'
                          : 'border-dashed border-slate-300 hover:border-orange-400 bg-slate-50'
                      }`}
                      title={isUploaded ? 'Click to preview full document photo' : 'Click to upload document photo'}
                    >
                      {isUploaded && photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={config.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {/* Hover Zoom Overlay */}
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-bold backdrop-blur-[1px]">
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                          </div>
                          {/* Corner Verified or Uploaded indicator */}
                          {isVerified ? (
                            <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : hasCustomPhoto ? (
                            <span className="absolute top-1.5 right-1.5 bg-slate-900/80 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                              Photo
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 group-hover:text-orange-600 transition-colors">
                          <Camera className="w-5 h-5 stroke-[1.75]" />
                          <span className="text-[10px] font-bold mt-1 leading-tight">Upload Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Middle: Details */}
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
                        <p className="text-xs text-slate-500 pt-0.5 leading-relaxed">
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
                      {isUploaded && (fileName || photoUrl) && (
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 pt-0.5">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 font-semibold truncate max-w-xs">{fileName || `${config.title.toLowerCase().replace(/\s+/g, '_')}.jpg`}</span>
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
                              : 'Document attached — Ready for Admin review'}
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

                  {/* Right Actions: [ Preview Photo ] [ Change Photo ] [ Remove ] OR [ Upload Photo ] */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {isItemUploading ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                      </span>
                    ) : photoUrl ? (
                      <>
                        {/* PREVIEW PHOTO BUTTON */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenPreview(item)}
                          leftIcon={Eye}
                          className="font-bold text-amber-800 hover:text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 border-amber-200"
                        >
                          View Photo
                        </Button>

                        {/* CHANGE / REPLACE PHOTO BUTTON */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTriggerFilePicker(config.key)}
                          leftIcon={Edit2}
                          className="font-bold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50"
                        >
                          Change Photo
                        </Button>

                        {/* REMOVE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(config)}
                          title="Remove document photo"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      /* SINGLE UPLOAD BUTTON */
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

      {/* 4. Submit All Documents for Review Action Card */}
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
                  Your documents are currently being reviewed by the HinchMart Admin team. You can replace photos anytime if needed.
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
                  : 'Please upload PAN Card, Aadhaar Card, and GSTIN Certificate above to enable final review submission.'}
              </p>
            </div>

            <Button
              variant="secondary"
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

      {/* 5. Photo Preview Modal with Full Resolution Image Display */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.config.title}
          subtitle={`Statutory KYC: ${previewDoc.config.docType} • Status: ${previewDoc.status || 'Pending'}`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const key = previewDoc.config.key;
                    setPreviewDoc(null);
                    handleTriggerFilePicker(key);
                  }}
                  leftIcon={Edit2}
                >
                  Change Photo
                </Button>
                {previewDoc.photoUrl && (
                  <a
                    href={previewDoc.photoUrl}
                    download={`${previewDoc.config.key.toLowerCase()}_photo.jpg`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>
              <Button variant="primary" size="sm" onClick={() => setPreviewDoc(null)}>
                Close Preview
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-1">
            {/* PHOTO DISPLAY CONTAINER */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 sm:p-4 flex items-center justify-center min-h-[260px] max-h-[60vh] relative shadow-inner">
              {previewDoc.photoUrl ? (
                <img
                  src={previewDoc.photoUrl}
                  alt={previewDoc.config.title}
                  className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg shadow-md mx-auto"
                />
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <Camera className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                  <p className="text-xs font-medium">No photo available for this document.</p>
                </div>
              )}
            </div>

            {/* Document Metadata Details Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {previewDoc.config.fieldLabel}
                  </span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 tracking-wider">
                    {previewDoc.docNumber ? previewDoc.config.mask(previewDoc.docNumber) : 'DOCUMENT ATTACHED'}
                  </span>
                </div>
                <StatusBadge status={previewDoc.status || 'Pending'} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">File Name</span>
                  <span className="font-mono text-slate-800 font-bold truncate block">
                    {previewDoc.fileName || `${previewDoc.config.key.toLowerCase()}_photo.jpg`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Verification Authority</span>
                  <span className="text-slate-800 font-semibold block">
                    {previewDoc.reviewedBy || 'HinchMart Compliance Admin'}
                  </span>
                </div>
              </div>

              {previewDoc.status === 'Verified' ? (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-[11.5px] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Statutory document verified against official registry. Verified B2B compliant.</span>
                </div>
              ) : previewDoc.status === 'Rejected' ? (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-[11.5px] font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Rejected: {previewDoc.rejectionReason || 'Please upload a clearer copy'}.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 text-[11.5px] font-medium">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Document attached and submitted for compliance review and validation.</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DocumentsPage;
