'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';
import { ROUTES } from '@/lib/constants';

interface ProductDetail {
  id: number;
  slug: string;
  name: string;
  description: string;
  brand: string;
  baseWeightGram: number;
  images: Array<{ id: number; url: string; isPrimary: boolean }>;
  variants: Array<{
    id: number;
    sku: string;
    color: string;
    size: string;
    price: number;
    compareAtPrice: number;
    stock: number;
    reserved: number;
  }>;
  categories: Array<{ id: number; name: string }>;
  colors: string[];
  sizes: string[];
  avgRating: number;
  reviewCount: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductDetail['variants'][0] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const data = await fetcher<ProductDetail>(`/api/products/${slug}`);
        setProduct(data);
        // Set default selections
        if (data.colors.length > 0) setSelectedColor(data.colors[0]);
        if (data.sizes.length > 0) setSelectedSize(data.sizes[0]);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  // Update selected variant when color or size changes
  useEffect(() => {
    if (product && selectedColor && selectedSize) {
      const variant = product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      );
      setSelectedVariant(variant || null);
      setQuantity(1); // Reset quantity
    }
  }, [product, selectedColor, selectedSize]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setAddingToCart(true);
    try {
      // Get or create cart ID from localStorage
      let cartId = localStorage.getItem('cartId');

      const response: any = await fetcher('/api/carts/items', {
        method: 'POST',
        body: {
          variantId: selectedVariant.id,
          qty: quantity,
        },
        headers: cartId ? { 'x-cart-id': cartId } : {},
      });

      // Save cart ID
      if (response.cartId) {
        localStorage.setItem('cartId', response.cartId);
      }

      // Trigger cart reload (via event or direct store call)
      window.dispatchEvent(new Event('cart-updated'));
      
      alert('Produk berhasil ditambahkan ke keranjang!');
    } catch (error: any) {
      alert(error.message || 'Gagal menambahkan ke keranjang');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-pink-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Memuat produk...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Produk tidak ditemukan</h1>
          <Link href={ROUTES.PRODUCTS} className="mt-4 inline-block text-pink-primary hover:underline">
            Kembali ke halaman produk
          </Link>
        </div>
      </div>
    );
  }

  const availableStock = selectedVariant ? selectedVariant.stock - selectedVariant.reserved : 0;
  const isOutOfStock = availableStock === 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center space-x-2 text-sm text-gray-600">
        <Link href={ROUTES.HOME} className="hover:text-pink-primary">
          Home
        </Link>
        <span>/</span>
        <Link href={ROUTES.PRODUCTS} className="hover:text-pink-primary">
          Produk
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div>
          <div className="overflow-hidden rounded-2xl bg-gray-100">
            <div className="relative aspect-square">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <svg className="h-24 w-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div>
          {/* Category & Brand */}
          <div className="mb-2 flex items-center gap-2">
            {product.categories.length > 0 && (
              <span className="text-sm font-medium text-pink-primary">
                {product.categories[0].name}
              </span>
            )}
            {product.brand && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{product.brand}</span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h1 className="mb-4 font-display text-3xl font-bold text-purple-deep">{product.name}</h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(product.avgRating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.avgRating} ({product.reviewCount} ulasan)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            {selectedVariant ? (
              <>
                <div className="text-3xl font-bold text-purple-deep">
                  {formatPrice(selectedVariant.price)}
                </div>
                {selectedVariant.compareAtPrice && (
                  <div className="text-lg text-gray-500 line-through">
                    {formatPrice(selectedVariant.compareAtPrice)}
                  </div>
                )}
              </>
            ) : (
              <div className="text-3xl font-bold text-purple-deep">Pilih varian</div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="mb-6 text-gray-600">{product.description}</p>
          )}

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Warna: <span className="font-normal text-gray-600">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      selectedColor === color
                        ? 'border-pink-primary bg-pink-primary text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-pink-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes.length > 0 && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Ukuran: <span className="font-normal text-gray-600">{selectedSize}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                      selectedSize === size
                        ? 'border-pink-primary bg-pink-primary text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-pink-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Info */}
          {selectedVariant && (
            <div className="mb-6">
              {isOutOfStock ? (
                <div className="text-red-600 font-semibold">Stok Habis</div>
              ) : (
                <div className="text-sm text-gray-600">
                  Stok tersedia: <span className="font-semibold">{availableStock}</span>
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          {!isOutOfStock && selectedVariant && (
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-gray-900">Jumlah</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 text-gray-700 hover:border-pink-primary hover:text-pink-primary transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= availableStock) {
                      setQuantity(val);
                    }
                  }}
                  className="h-10 w-20 rounded-lg border-2 border-gray-300 text-center font-semibold focus:border-pink-primary focus:outline-none"
                  min={1}
                  max={availableStock}
                />
                <button
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-300 text-gray-700 hover:border-pink-primary hover:text-pink-primary transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || isOutOfStock || addingToCart}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? 'Menambahkan...' : isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}
          </button>

          {/* Product Details */}
          <div className="mt-8 space-y-4 border-t border-gray-200 pt-8">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-pink-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Material Berkualitas</div>
                <div className="text-sm text-gray-600">Terbuat dari bahan premium yang tahan lama</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-pink-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Pengiriman Cepat</div>
                <div className="text-sm text-gray-600">Dikirim dalam 1-2 hari kerja</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-pink-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="font-semibold text-gray-900">Berat: {product.baseWeightGram}g</div>
                <div className="text-sm text-gray-600">Ongkir dihitung saat checkout</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
