import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Paperclip,
  ExternalLink,
  ShieldCheck,
  User,
  Hash,
  Tag,
  Flag,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useSupportTicket } from '../../hooks/useSupportTickets';
import { Button } from '../../components/common/Button';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
} from '../../services/supportTicket.service';
import { formatDate } from '../../utils/formatters';

export function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { ticket, messages = [], isLoading, isError, error, addMessage, isSendingMessage, refetch } = useSupportTicket(id);

  const [replyContent, setReplyContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentField, setShowAttachmentField] = useState(false);
  const [replyError, setReplyError] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      setReplyError('Please enter a message before sending');
      return;
    }

    try {
      setReplyError('');
      await addMessage({
        content: replyContent.trim(),
        attachmentUrl: attachmentUrl?.trim() || null,
      });
      setReplyContent('');
      setAttachmentUrl('');
      setShowAttachmentField(false);
    } catch (err) {
      setReplyError(err.message || 'Failed to send reply');
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'OPEN').toUpperCase();
    switch (s) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Open (Awaiting Support Review)
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    const p = String(priority || 'MEDIUM').toUpperCase();
    const config = SUPPORT_PRIORITIES.find((item) => item.value === p) || SUPPORT_PRIORITIES[1];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${config.color}`}>
        {config.label} Priority
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        <p className="text-sm font-medium text-slate-600">Loading ticket thread #{id}...</p>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Unable to load ticket #{id}</h2>
        <p className="text-sm text-slate-500">
          {error?.message || 'This ticket could not be found or does not belong to your account.'}
        </p>
        <Button onClick={() => navigate('/seller/support')} variant="outline">
          Back to Support Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/seller/support')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Support Tickets
        </button>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          title="Refresh conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-200/80">
              {ticket.ticketNumber || `STKT-${ticket.ticketId || ticket.id}`}
            </span>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              {SUPPORT_CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Created on {formatDate(ticket.createdAt)}
          </div>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {ticket.subject}
          </h1>

          {ticket.orderId && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                Related to Order #{ticket.orderId}
              </span>
              <Link
                to={`/seller/orders/${ticket.orderId}`}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View Order Details
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Message Thread Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {/* Thread Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Conversation Thread ({messages.length} message{messages.length === 1 ? '' : 's'})
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Last activity: {formatDate(ticket.updatedAt || ticket.createdAt)}
          </span>
        </div>

        {/* Message Bubble List */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[600px] overflow-y-auto bg-slate-50/30">
          {messages.map((msg, index) => {
            const isAgent = msg.senderRole === 'SUPPORT_AGENT' || msg.senderRole === 'ADMIN';
            return (
              <div
                key={msg.messageId || index}
                className={`flex gap-3 sm:gap-4 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-xs ${
                    isAgent
                      ? 'bg-slate-900 text-white'
                      : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white'
                  }`}
                >
                  {isAgent ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                {/* Bubble Container */}
                <div className={`space-y-1.5 max-w-[85%] sm:max-w-[75%] ${isAgent ? 'items-start' : 'items-end'}`}>
                  {/* Sender Metadata */}
                  <div className={`flex items-center gap-2 text-xs ${isAgent ? 'justify-start' : 'justify-end'}`}>
                    <span className="font-bold text-slate-900">
                      {isAgent ? 'HinchMart Support' : msg.senderName || ticket.sellerName || 'You (Seller)'}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isAgent
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {isAgent ? 'Support Agent' : 'Seller'}
                    </span>
                    <span className="text-slate-400 text-[11px] font-normal">
                      {formatDate(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message Body */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      isAgent
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        : 'bg-orange-500 text-white rounded-tr-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Attachment Link if present */}
                    {msg.attachmentUrl && (
                      <div className="mt-3 pt-2.5 border-t border-black/10">
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                            isAgent
                              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          View Attachment
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Reply Form */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white">
          <form onSubmit={handleSendReply} className="space-y-3">
            {ticket.status === 'CLOSED' && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  This ticket is currently <strong>Closed</strong>. Sending a new reply will automatically re-open it to <strong>In Progress</strong> for our agents.
                </span>
              </div>
            )}

            <div className="relative">
              <textarea
                rows={3}
                placeholder="Type your reply here to respond to the support agent..."
                value={replyContent}
                onChange={(e) => {
                  setReplyContent(e.target.value);
                  if (replyError) setReplyError('');
                }}
                disabled={isSendingMessage}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Optional Attachment Link Field */}
            {showAttachmentField && (
              <div className="animate-fade-in flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="url"
                  placeholder="Paste direct document/screenshot URL (e.g. https://storage...)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {replyError && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {replyError}
              </p>
            )}

            {/* Form Action Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowAttachmentField(!showAttachmentField)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                {showAttachmentField ? 'Hide Attachment URL' : 'Attach File URL'}
              </button>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSendingMessage}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5"
              >
                <Send className="w-4 h-4" />
                Send Reply
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
