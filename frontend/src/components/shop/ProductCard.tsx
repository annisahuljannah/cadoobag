import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/formatting';
import { ROUTES } from '@/lib/constants';
import { Product } from '@/types/dto';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { slug, name, images, variants, categories } = product;
  
  // Get primary image or first image
  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  
  // Get minimum price from variants
  const minPrice = variants.length > 0 
    ? Math.min(...variants.map((v) => v.price))
    : 0;
    
  // Calculate total stock
  const totalStock = variants.reduce((sum, v) => {
    return sum + (v.inventory?.stock || 0);
  }, 0);
  
  return (
    <Link href={ROUTES.PRODUCT_DETAIL(slug)} className="group">
      <div className="overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          )}
          {/* Stock badge */}
          {totalStock === 0 && (
            <div className="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
              Habis
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {categories.length > 0 && (
            <div className="mb-2 text-xs font-medium text-pink-primary">
              {categories[0].category.name}
            </div>
          )}

          {/* Name */}
          <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2 group-hover:text-pink-primary transition-colors">
            {name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-purple-deep">{formatPrice(minPrice)}</span>
            {totalStock > 0 && totalStock < 10 && (
              <span className="text-xs text-gray-500">Sisa {totalStock}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
