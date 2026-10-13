import React, { useState } from 'react';
import { UploadCloud, X, Star, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { compressImageFile } from '../../utils/imageCompressor';

export function ImageUploader({
  images = [],
  onChange,
  maxImages = 6,
  error,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newImgs = [...images];
    for (const file of files) {
      if (newImgs.length < maxImages) {
        try {
          const compressed = await compressImageFile(file);
          if (compressed && newImgs.length < maxImages) {
            newImgs.push(compressed);
          }
        } catch (err) {
          console.error('Failed to compress image:', err);
        }
      }
    }
    onChange(newImgs);
  };

  const handleRemove = (index) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMakePrimary = (index) => {
    if (index === 0) return;
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    onChange([selected, ...rest]);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={`p-6 border-2 border-dashed rounded-lg text-center transition-all ${
          dragActive
            ? 'border-amber-500 bg-amber-50/50'
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100/60'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-2 shadow-2xs">
          <UploadCloud className="w-6 h-6 text-amber-500" />
        </div>

        <p className="text-xs font-bold text-slate-800">
          Drag & drop construction product images or{' '}
          <label className="text-amber-600 hover:text-amber-700 cursor-pointer underline">
            Browse files
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        </p>

        <p className="text-[11px] text-slate-400 mt-1">
          JPG, PNG, WebP up to 10MB each (Maximum {maxImages} images)
        </p>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-xs"
            >
              <img src={imgUrl} alt={`Product media ${index + 1}`} className="w-full h-full object-cover" />

              {/* Primary Badge */}
              {index === 0 ? (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shadow-xs">
                  Primary
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMakePrimary(index)}
                  className="absolute top-1.5 left-1.5 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-slate-950"
                  title="Make primary image"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1.5 right-1.5 p-1 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 shadow-xs"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
