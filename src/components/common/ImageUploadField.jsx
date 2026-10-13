import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileImage,
} from 'lucide-react';

import { uploadService } from '../../services/upload.service';

export function ImageUploadField({
  label = 'Artwork / Thumbnail Image',
  helperText = 'Attach an image from your device or provide a public URL.',
  value = '',
  onChange,
  presets = null,
  selectedPreset = null,
  onSelectPreset = null,
  required = false,
  uploadType = 'categories',
  className = '',
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFile = async (file) => {
    if (!file) return;

    // Check if it is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const res = await uploadService.uploadFile(
        file,
        (progress) => setUploadProgress(progress),
        uploadType
      );

      if (res?.url) {
        setImgError(false);
        setFileInfo({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        });
        if (onChange) onChange(res.url);
      }
    } catch (err) {
      console.warn('S3 upload error, falling back to local preview:', err?.message);
      // Fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        setImgError(false);
        setFileInfo({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
        });
        if (onChange) onChange(rawDataUrl);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFileInfo(null);
    setImgError(false);
    if (onChange) onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDataUrl = value && value.startsWith('data:image');

  return (
    <div className={`p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3 ${className}`}>
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
          <ImageIcon className="w-4 h-4 text-amber-500" />
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsUrlMode(!isUrlMode)}
          className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{isUrlMode ? 'Switch to File Upload' : 'Paste Image URL'}</span>
        </button>
      </div>

      {/* Presets (if provided, e.g. for Brands) */}
      {presets && presets.length > 0 && (
        <div className="space-y-1.5 pb-2 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Presets</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {presets.map((preset) => {
              const isSelected = selectedPreset === preset.name || value === (preset.logo || preset.image);
              return (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => {
                    if (onSelectPreset) onSelectPreset(preset);
                    if (onChange) onChange(preset.logo || preset.image);
                    setImgError(false);
                    setFileInfo(null);
                  }}
                  className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src={preset.logo || preset.image}
                    alt={preset.name}
                    className="w-7 h-7 object-cover rounded mb-1"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-700 truncate w-full block">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* URL Input Bar (if URL mode is toggled on or if user wants to type URL) */}
      {isUrlMode ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or S3 link"
              value={value}
              onChange={(e) => {
                setImgError(false);
                setFileInfo(null);
                if (onChange) onChange(e.target.value);
              }}
              className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs font-mono"
            />
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-2.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Clear URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Paste any direct HTTPS image link (JPG, PNG, WebP, SVG).
          </p>
        </div>
      ) : null}

      {/* Main Upload / Preview Area */}
      {isUploading ? (
        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-slate-800">Uploading image to AWS S3 storage...</p>
            <p className="text-[11px] text-amber-700 font-mono font-bold">{uploadProgress}% complete</p>
          </div>
          <div className="w-48 bg-amber-200/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : value ? (
        /* Preview State */
        <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 shadow-2xs overflow-hidden shrink-0 flex items-center justify-center">
              {!imgError ? (
                <img
                  src={value}
                  alt="Uploaded Preview"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {fileInfo?.name || (isDataUrl ? 'Uploaded File' : 'Linked Image')}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                {fileInfo?.size ? `${fileInfo.size}` : isDataUrl ? 'Direct File Upload' : value}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Change</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 shadow-2xs cursor-pointer transition-colors"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Drop Zone State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-50/70 scale-[1.01]'
              : 'border-slate-200 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/30'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mx-auto text-amber-500 mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="text-xs font-bold text-slate-800">
            <span className="text-amber-600 hover:underline">Click to browse files</span> or drag & drop image here
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {helperText}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Supports PNG, JPG, WEBP, SVG (Max 5MB)
          </p>
        </div>
      )}
    </div>
  );
}
