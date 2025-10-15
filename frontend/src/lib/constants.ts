export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  ADMIN: '/admin',
};

export const ORDER_STATUS = {
  PENDING: 'Menunggu Pembayaran',
  PAID: 'Dibayar',
  PACKED: 'Dikemas',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export const PAYMENT_STATUS = {
  PENDING: 'Menunggu',
  PAID: 'Dibayar',
  FAILED: 'Gagal',
  EXPIRED: 'Kadaluarsa',
  NEED_VERIFICATION: 'Menunggu Verifikasi',
};
