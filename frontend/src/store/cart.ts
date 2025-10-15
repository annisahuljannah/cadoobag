import { create } from 'zustand';

interface CartItem {
  id: number;
  variantId: number;
  qty: number;
  product: {
    id: number;
    name: string;
    slug: string;
    image: string;
  };
  variant: {
    id: number;
    sku: string;
    color?: string;
    size?: string;
    price: number;
    stock: number;
  };
}

interface CartState {
  cartId: string | null;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  setCartId: (id: string) => void;
  setItems: (items: CartItem[]) => void;
  setSubtotal: (subtotal: number) => void;
  setTotalItems: (total: number) => void;
  openCart: () => void;
  closeCart: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cartId: null,
  items: [],
  subtotal: 0,
  totalItems: 0,
  isOpen: false,
  isLoading: false,

  setCartId: (id) => set({ cartId: id }),
  setItems: (items) => set({ items }),
  setSubtotal: (subtotal) => set({ subtotal }),
  setTotalItems: (total) => set({ totalItems: total }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
