import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Hash,
  Tag,
  Paperclip,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { useSupportTickets } from '../../hooks/useSupportTickets';
import { CreateTicketModal } from '../../components/support/CreateTicketModal';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from '../../services/supportTicket.service';
import { formatDate } from '../../utils/formatters';

export function SupportTicketsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Query live/cached tickets
  const { tickets = [], pagination, isLoading, isRefetching, createTicket, isCreating } = useSupportTickets({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page: currentPage,
    limit: pageSize,
  });

  // Client-side quick filter for instant search & taxonomy refinement
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search query filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const num = String(t.ticketNumber || t.ticketId || '').toLowerCase();
        const sub = String(t.subject || '').toLowerCase();
        const cat = String(t.category || '').toLowerCase();
        const order = String(t.orderId || '').toLowerCase();
        if (!num.includes(q) && !sub.includes(q) && !cat.includes(q) && !order.includes(q)) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tickets, searchTerm, categoryFilter, priorityFilter]);

  // Status Metrics
  const metrics = useMemo(() => {
    const all = tickets;
    return {
      total: all.length,
      open: all.filter((t) => t.status === 'OPEN').length,
      inProgress: all.filter((t) => t.status === 'IN_PROGRESS').length,
      resolved: all.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    };
  }, [tickets]);

  const getStatusBadge = (status) => {
    const s = String(status || 'OPEN').toUpperCase();
    switch (s) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    const p = String(priority || 'MEDIUM').toUpperCase();
    const config = SUPPORT_PRIORITIES.find((item) => item.value === p) || SUPPORT_PRIORITIES[1];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex p-2 rounded-lg bg-orange-100 text-orange-600">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Seller Support Desk
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Submit issues regarding payouts, commission rates, inventory, or orders to the HinchMart team.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Support Ticket
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tickets</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-600">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.total}</p>
          <p className="text-xs text-slate-400 mt-0.5">All created enquiries</p>
        </div>

        <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Awaiting Review</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{metrics.open}</p>
          <p className="text-xs text-amber-600/80 mt-0.5">Assigned to support agent</p>
        </div>

        <div className="bg-white rounded-xl border border-blue-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <HelpCircle className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-2">{metrics.inProgress}</p>
          <p className="text-xs text-blue-600/80 mt-0.5">Active investigation</p>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Resolved</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{metrics.resolved}</p>
          <p className="text-xs text-emerald-600/80 mt-0.5">Completed tickets</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          {[
            { id: 'ALL', label: 'All Tickets' },
            { id: 'OPEN', label: 'Open' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'RESOLVED', label: 'Resolved' },
            { id: 'CLOSED', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-orange-50 text-orange-600 border border-orange-200/70 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Select Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Ticket Number, Subject, Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {SUPPORT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              {SUPPORT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} Priority
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading support tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={LifeBuoy}
              title="No support tickets found"
              description={
                searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'No tickets match the selected filters. Try clearing your search parameters.'
                  : "You haven't opened any support tickets yet. If you have any issue regarding payments, commission, or orders, create a ticket."
              }
              actionLabel="Create Support Ticket"
              onAction={() => setIsCreateModalOpen(true)}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const ticketId = ticket.ticketId || ticket.id;
              const messagesCount = ticket.messages?.length || 0;
              const lastMessage = ticket.messages?.[messagesCount - 1];

              return (
                <div
                  key={ticketId}
                  onClick={() => navigate(`/seller/support/${ticketId}`)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/70">
                          {ticket.ticketNumber || `STKT-${ticketId}`}
                        </span>

                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}

                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {SUPPORT_CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                        </span>

                        {ticket.orderId && (
                          <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Hash className="w-3 h-3 text-slate-400" />
                            Order #{ticket.orderId}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                        {ticket.subject}
                      </h3>

                      {lastMessage && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          <span className="font-semibold text-slate-700">
                            {lastMessage.senderRole === 'SUPPORT_AGENT' ? 'Support Desk: ' : 'You: '}
                          </span>
                          {lastMessage.content}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 text-right">
                      <div className="text-[11px] text-slate-400">
                        Updated {formatDate(ticket.updatedAt || ticket.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                        <span>{messagesCount} message{messagesCount === 1 ? '' : 's'}</span>
                        <ChevronRight className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createTicket}
        isSubmitting={isCreating}
      />
    </div>
  );
}
