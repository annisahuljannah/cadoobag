/**
 * Calculate subtotal from order items
 */
export function calculateSubtotal(items: Array<{ price: number; qty: number }>): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/**
 * Calculate discount amount based on voucher
 */
export function calculateDiscount(
  subtotal: number,
  voucher: { type: string; value: number; minSpend: number } | null
): number {
  if (!voucher || subtotal < voucher.minSpend) {
    return 0;
  }

  if (voucher.type === 'PERCENT') {
    return Math.floor((subtotal * voucher.value) / 100);
  }

  if (voucher.type === 'FIXED') {
    return Math.min(voucher.value, subtotal);
  }

  return 0;
}

/**
 * Calculate order total
 */
export function calculateTotal(subtotal: number, shippingCost: number, discount: number): number {
  return subtotal + shippingCost - discount;
}

/**
 * Convert rupiah to cents (store as integer)
 */
export function rupiahToCents(rupiah: number): number {
  return rupiah;
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(cents);
}
