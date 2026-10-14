import React, { useState } from 'react';
import {
  LifeBuoy,
  AlertCircle,
  Paperclip,
  Send,
  Hash,
  Tag,
  Flag,
  FileText,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
} from '../../services/supportTicket.service';

export function CreateTicketModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'COMMISSION',
    priority: 'MEDIUM',
    orderId: '',
    message: '',
    attachmentUrl: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.subject.trim()) {
      errs.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      errs.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.message.trim()) {
      errs.message = 'Please describe your issue in detail';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Description must be at least 10 characters';
    }

    if (formData.orderId && isNaN(Number(formData.orderId))) {
      errs.orderId = 'Order ID must be a numeric ID (e.g. 10452)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        subject: formData.subject.trim(),
        category: formData.category,
        priority: formData.priority,
        orderId: formData.orderId ? Number(formData.orderId) : undefined,
        message: formData.message.trim(),
        attachmentUrl: formData.attachmentUrl?.trim() || undefined,
      });

      // Reset
      setFormData({
        subject: '',
        category: 'COMMISSION',
        priority: 'MEDIUM',
        orderId: '',
        message: '',
        attachmentUrl: '',
      });
      setErrors({});
      onClose();
    } catch (_) {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Support Ticket"
      subtitle="Submit an issue or enquiry directly to the HinchMart Seller Desk"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Ticket Subject <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Incorrect commission fee calculation on SKU-9912"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: null });
              }}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                errors.subject
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-orange-500 focus:ring-orange-100'
              }`}
            />
          </div>
          {errors.subject && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.subject}
            </p>
          )}
        </div>

        {/* Category & Priority Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer"
            >
              {SUPPORT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-slate-500" />
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer"
            >
              {SUPPORT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} Priority
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Order ID */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-slate-500" />
            Related Order ID <span className="text-slate-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 10452 or 88219"
            value={formData.orderId}
            onChange={(e) => {
              setFormData({ ...formData, orderId: e.target.value });
              if (errors.orderId) setErrors({ ...errors, orderId: null });
            }}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
          />
          {errors.orderId && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.orderId}
            </p>
          )}
        </div>

        {/* Message / Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Issue Details <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Please explain the discrepancy, what happened, and any relevant details to help our team resolve this quickly..."
            value={formData.message}
            onChange={(e) => {
              setFormData({ ...formData, message: e.target.value });
              if (errors.message) setErrors({ ...errors, message: null });
            }}
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-y ${
              errors.message
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-orange-500 focus:ring-orange-100'
            }`}
          />
          {errors.message && (
            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.message}
            </p>
          )}
        </div>

        {/* Attachment URL (optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            Supporting Document / Screenshot URL <span className="text-slate-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://storage.example.com/tickets/doc1.pdf"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Provide a direct link to an image, PDF invoice, or statement for faster review.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            <Send className="w-4 h-4" />
            Submit Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}
