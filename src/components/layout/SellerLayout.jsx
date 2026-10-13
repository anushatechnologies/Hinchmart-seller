import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

export function SellerLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modals & Toasts */}
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
}
