'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';
import { ROUTES } from '@/lib/constants';

interface CartResponse {
  id: string;
  items: Array<{
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
  }>;
  subtotal: number;
  totalItems: number;
}

export function CartDrawer() {
  const {
    cartId,
    items,
    subtotal,
    totalItems,
    isOpen,
    isLoading,
    setCartId,
    setItems,
    setSubtotal,
    setTotalItems,
    closeCart,
    setLoading,
  } = useCartStore();

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const cartId = localStorage.getItem('cartId');

      const headers: Record<string, string> = cartId ? { 'x-cart-id': cartId } : {};
      const data = await fetcher<CartResponse>('/api/carts', { headers });

      setCartId(data.id);
      setItems(data.items);
      setSubtotal(data.subtotal);
      setTotalItems(data.totalItems);

      // Save cart ID
      localStorage.setItem('cartId', data.id);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, qty: number) => {
    setLoading(true);
    try {
      await fetcher(`/api/carts/items/${itemId}`, {
        method: 'PATCH',
        body: { qty },
      });
      await loadCart();
    } catch (error: any) {
      alert(error.message || 'Gagal mengupdate jumlah');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm('Hapus item dari keranjang?')) return;

    setLoading(true);
    try {
      await fetcher(`/api/carts/items/${itemId}`, {
        method: 'DELETE',
      });
      await loadCart();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus item');
    } finally {
      setLoading(false);
    }
  };

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isOpen) {
        loadCart();
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="font-display text-xl font-bold text-purple-deep">
            Keranjang ({totalItems})
          </h2>
          <button
            onClick={closeCart}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-primary border-t-transparent"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <svg
                className="h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="mt-4 text-gray-600">Keranjang Anda kosong</p>
              <Link
                href={ROUTES.PRODUCTS}
                onClick={closeCart}
                className="mt-4 btn-primary"
              >
                Belanja Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-lg border border-gray-200 p-4">
                  {/* Image */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={ROUTES.PRODUCT_DETAIL(item.product.slug)}
                      onClick={closeCart}
                      className="font-semibold text-gray-900 hover:text-pink-primary line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-1 text-sm text-gray-600">
                      {item.variant.color && <span>{item.variant.color}</span>}
                      {item.variant.color && item.variant.size && <span> • </span>}
                      {item.variant.size && <span>{item.variant.size}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-purple-deep">
                        {formatPrice(item.variant.price)}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.qty - 1))}
                          disabled={isLoading || item.qty <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm hover:border-pink-primary hover:text-pink-primary disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          disabled={isLoading || item.qty >= item.variant.stock}
                          className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm hover:border-pink-primary hover:text-pink-primary disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isLoading}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-2xl font-bold text-purple-deep">
                {formatPrice(subtotal)}
              </span>
            </div>
            <Link
              href={ROUTES.CHECKOUT}
              onClick={closeCart}
              className="btn-primary w-full block text-center"
            >
              Checkout
            </Link>
            <button
              onClick={closeCart}
              className="btn-secondary mt-2 w-full"
            >
              Lanjut Belanja
            </button>
          </div>
        )}
      </div>
    </>
  );
}
