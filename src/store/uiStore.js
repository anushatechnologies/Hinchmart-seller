import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  mobileMenuOpen: false,
  globalSearchOpen: false,
  toasts: [],

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  toggleGlobalSearch: () => set(state => ({ globalSearchOpen: !state.globalSearchOpen })),

  addToast: ({ title, message, type = 'success', duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast = { id, title, message, type };
    set(state => ({ toasts: [...state.toasts, newToast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },
}));
