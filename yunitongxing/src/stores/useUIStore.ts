import { create } from 'zustand'

interface UIState {
  isLoading: boolean
  loadingMessage: string
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info'
  isShareSheetOpen: boolean

  showLoading: (message?: string) => void
  hideLoading: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  toggleShareSheet: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isLoading: false,
  loadingMessage: '',
  toastMessage: null,
  toastType: 'info',
  isShareSheetOpen: false,

  showLoading: (message = '加载中...') => set({ isLoading: true, loadingMessage: message }),
  hideLoading: () => set({ isLoading: false, loadingMessage: '' }),
  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type })
    setTimeout(() => set({ toastMessage: null }), 2500)
  },
  toggleShareSheet: () => set((s) => ({ isShareSheetOpen: !s.isShareSheetOpen })),
}))
