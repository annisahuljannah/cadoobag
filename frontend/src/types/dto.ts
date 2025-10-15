// Product types
export interface Product {
  id: number;
  slug: string;
  name: string;
  description?: string;
  baseWeightGram: number;
  brand?: string;
  active: boolean;
  images: ProductImage[];
  variants: Variant[];
  categories: { category: Category }[];
}

export interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

export interface Variant {
  id: number;
  sku: string;
  color?: string;
  size?: string;
  price: number;
  compareAtPrice?: number;
  inventory?: Inventory;
}

export interface Inventory {
  stock: number;
  reserved: number;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
}

// Cart types
export interface Cart {
  id: string;
  items: CartItem[];
}

export interface CartItem {
  id: number;
  variant: Variant & { product: Product };
  qty: number;
}

// Order types
export interface Order {
  id: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  courier?: string;
  service?: string;
  waybill?: string;
  createdAt: string;
  items: OrderItem[];
  payments: Payment[];
  address: Address;
}

export interface OrderItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export interface Payment {
  id: string;
  method: string;
  channel?: string;
  amount: number;
  status: string;
  refNo?: string;
  vaNo?: string;
  paidAt?: string;
}

// Address types
export interface Address {
  id: number;
  label: string;
  receiver: string;
  phone: string;
  provinceId: number;
  provinceName: string;
  cityId: number;
  cityName: string;
  subdistrictId: number;
  subdistrictName: string;
  postalCode: string;
  detail: string;
  isDefault: boolean;
}

// Shipping types
export interface ShippingCost {
  service: string;
  description: string;
  cost: number;
  etd: string;
}

// Voucher types
export interface Voucher {
  code: string;
  type: string;
  value: number;
  minSpend: number;
}
