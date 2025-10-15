'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';
import { Order } from '@/types/dto';

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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetcher<{
          success: boolean;
          data: { order: Order };
        }>(`/orders/${orderId}`);

        if (response.success) {
          setOrder(response.data.order);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePayNow = () => {
    if (order?.paymentReference) {
      router.push(`/payment/${order.paymentReference}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Memuat detail pesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-medium">
              {error || 'Pesanan tidak ditemukan'}
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/orders"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Kembali ke Daftar Pesanan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const latestPayment = order.payments?.[0];

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Kembali ke Daftar Pesanan
          </Link>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {order.orderNumber}
              </h1>
              <p className="text-gray-600">
                {new Date(order.createdAt).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  PAYMENT_STATUS_COLORS[order.paymentStatus] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {PAYMENT_STATUS_LABELS[order.paymentStatus] ||
                  order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Payment Action */}
          {order.paymentStatus === 'UNPAID' && order.paymentReference && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-yellow-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Menunggu Pembayaran
                  </h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Pesanan Anda menunggu pembayaran. Segera lakukan pembayaran
                    untuk melanjutkan proses pesanan.
                  </p>
                  <button
                    onClick={handlePayNow}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    Bayar Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Order Number Copy */}
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">
              Nomor Pesanan: <span className="font-mono">{order.orderNumber}</span>
            </p>
            <button
              onClick={() => copyToClipboard(order.orderNumber)}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {copying ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Informasi Pengiriman
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Alamat Tujuan
              </h3>
              <div className="text-gray-900">
                <p className="font-medium">{order.address.receiver}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.address.phone}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {order.address.detail}
                </p>
                <p className="text-sm text-gray-600">
                  {order.address.subdistrictName}, {order.address.cityName}
                </p>
                <p className="text-sm text-gray-600">
                  {order.address.provinceName} {order.address.postalCode}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Kurir & Layanan
              </h3>
              {order.courier && order.service ? (
                <div className="text-gray-900">
                  <p className="font-medium uppercase">{order.courier}</p>
                  <p className="text-sm text-gray-600">{order.service}</p>
                  {order.waybill && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">
                        Nomor Resi:
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{order.waybill}</p>
                        <button
                          onClick={() => copyToClipboard(order.waybill!)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {copying ? '✓' : 'Salin'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Menunggu diproses</p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Produk Pesanan
          </h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
              >
                {item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0].url}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.name}</h3>
                  {item.variant && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.variant.size && `Size: ${item.variant.size}`}
                      {item.variant.color && ` • Color: ${item.variant.color}`}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">SKU: {item.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-600">
                      {item.qty} × {formatPrice(item.price)}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ringkasan Pembayaran
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Ongkos Kirim</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="pt-3 border-t flex justify-between font-bold text-gray-900 text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          {order.paymentMethod && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </h3>
              <p className="text-gray-900 font-medium uppercase">
                {order.paymentMethod}
              </p>
              {latestPayment && (
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      PAYMENT_STATUS_COLORS[latestPayment.status] ||
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[latestPayment.status] ||
                      latestPayment.status}
                  </span>
                  {latestPayment.paidAt && (
                    <p className="text-sm text-gray-600 mt-2">
                      Dibayar pada:{' '}
                      {new Date(latestPayment.paidAt).toLocaleDateString(
                        'id-ID',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/products"
            className="flex-1 bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Belanja Lagi
          </Link>
          {order.status === 'DELIVERED' && (
            <button
              className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              onClick={() => {
                // TODO: Implement reorder functionality
                alert('Fitur pesan ulang akan segera hadir!');
              }}
            >
              Pesan Ulang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
