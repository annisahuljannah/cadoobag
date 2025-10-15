'use client';

import { useState, useEffect } from 'react';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { fetcher } from '@/lib/fetcher';
import type { Product } from '@/types/dto';

interface ProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const response = await fetcher<ProductsResponse>(`/api/products?page=${page}&limit=12`);
        setProducts(response.data);
        setTotalPages(response.meta.totalPages);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [page]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-purple-deep">Semua Produk</h1>
        <p className="mt-2 text-gray-600">Temukan koleksi tas wanita terbaik kami</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Memuat produk...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <ProductGrid products={products} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-secondary"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
