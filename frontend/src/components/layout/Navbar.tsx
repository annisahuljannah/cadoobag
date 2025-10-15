'use client';

import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import { useCartStore } from '@/store/cart';

export function Navbar() {
  const { totalItems, openCart } = useCartStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="container mx-auto max-w-7xl">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center space-x-2">
            <div className="text-2xl font-display font-bold text-purple-deep">
              Cadoo<span className="text-pink-primary">bag</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href={ROUTES.PRODUCTS}
              className="text-gray-700 hover:text-pink-primary transition-colors font-medium"
            >
              Produk
            </Link>
            <Link
              href="/orders"
              className="text-gray-700 hover:text-pink-primary transition-colors font-medium"
            >
              Pesanan
            </Link>
            <Link
              href={ROUTES.PRODUCTS}
              className="text-gray-700 hover:text-pink-primary transition-colors font-medium"
            >
              Kategori
            </Link>
          </div>

          {/* Right side - Cart and User */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <button
              onClick={openCart}
              className="relative rounded-lg p-2 hover:bg-pink-light/30 transition-colors"
            >
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {/* Cart badge */}
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-primary text-xs font-bold text-white">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* User Menu - placeholder */}
            <button className="rounded-lg p-2 hover:bg-pink-light/30 transition-colors">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
