import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  panelId: string;
  structureId: string;
  panelCode: string;
  address: string;
  district: string;
  photoUrl: string | null;
  dailyPrice: number;
  startDate: string;
  endDate: string;
  days: number;
  totalPrice: number;
  format: string;
  mediaType: string;
};

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItem: (panelId: string, updates: Partial<CartItem>) => void;
  removeItem: (panelId: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        // Prevent adding duplicate panels
        if (state.items.some(i => i.panelId === item.panelId)) {
          return state;
        }
        return { items: [...state.items, item] };
      }),
      updateItem: (panelId, updates) => set((state) => ({
        items: state.items.map(item => 
          item.panelId === panelId ? { ...item, ...updates } : item
        )
      })),
      removeItem: (panelId) => set((state) => ({
        items: state.items.filter(item => item.panelId !== panelId)
      })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.length,
      getTotalPrice: () => get().items.reduce((total, item) => total + item.totalPrice, 0),
    }),
    {
      name: 'jmt-cart-storage',
    }
  )
);
