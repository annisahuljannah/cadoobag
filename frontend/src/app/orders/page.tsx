'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';
import { OrderListItem } from '@/types/dto';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  REFUND: 'bg-purple-100 text-purple-800',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  COMPLETED: 'Selesai',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Belum Bayar',
  PAID: 'Sudah Bayar',
  FAILED: 'Gagal',
  EXPIRED: 'Kadaluarsa',
  REFUND: 'Refund',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<{
    status?: string;
    paymentStatus?: string;
  }>({});
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const fetchOrders = async (offset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });

      if (filter.status) {
        params.append('status', filter.status);
      }

      if (filter.paymentStatus) {
        params.append('paymentStatus', filter.paymentStatus);
      }

      const response = await fetcher<{
        success: boolean;
        data: {
          orders: OrderListItem[];
          pagination: typeof pagination;
        };
      }>(`/orders?${params.toString()}`);

      if (response.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(0);
  }, [filter]);

  const handleLoadMore = () => {
    fetchOrders(pagination.offset + pagination.limit);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Memuat pesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
          <p className="text-gray-600 mt-2">
            Lihat dan lacak semua pesanan Anda
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Pesanan
              </label>
              <select
                value={filter.status || ''}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value || undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="PENDING">Menunggu</option>
                <option value="PROCESSING">Diproses</option>
                <option value="SHIPPED">Dikirim</option>
                <option value="DELIVERED">Selesai</option>
                <option value="CANCELLED">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Pembayaran
              </label>
              <select
                value={filter.paymentStatus || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    paymentStatus: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="UNPAID">Belum Bayar</option>
                <option value="PAID">Sudah Bayar</option>
                <option value="FAILED">Gagal</option>
                <option value="EXPIRED">Kadaluarsa</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Pesanan
            </h3>
            <p className="text-gray-600 mb-6">
              Anda belum memiliki pesanan. Mulai belanja sekarang!
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                            order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="space-y-3 mb-4">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0].url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.variant?.size && `Size: ${item.variant.size}`}
                            {item.variant?.color &&
                              ` • Color: ${item.variant.color}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.qty} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-gray-600">
                        +{order.items.length - 2} produk lainnya
                      </p>
                    )}
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      <p>
                        Pengiriman ke:{' '}
                        <span className="font-medium text-gray-900">
                          {order.address.receiver}
                        </span>
                      </p>
                      <p>{order.address.cityName}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1">
                      Lihat Detail
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination.hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Menampilkan {orders.length} dari {pagination.total} pesanan
          </div>
        )}
      </div>
    </div>
  );
}
