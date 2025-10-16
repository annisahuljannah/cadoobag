'use client';

import { useEffect, useState } from 'react';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';

interface PendingPayment {
  id: string;
  orderId: string;
  amount: number;
  proofImageUrl: string;
  meta: string;
  createdAt: string;
  order: {
    orderNumber: string;
    address: {
      receiver: string;
      phone: string;
    };
  };
}

export default function AdminPaymentVerificationPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState<{
    [key: string]: string;
  }>({});

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await fetcher<{
        success: boolean;
        data: {
          payments: PendingPayment[];
          count: number;
        };
      }>('/manual-payment/admin/pending');

      if (response.success) {
        setPayments(response.data.payments);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleVerify = async (paymentId: string) => {
    if (!confirm('Apakah Anda yakin ingin memverifikasi pembayaran ini?')) {
      return;
    }

    try {
      setProcessing(paymentId);
      setError('');

      const response = await fetcher<{ success: boolean; message: string }>(`/manual-payment/admin/verify/${paymentId}`, {
        method: 'POST',
      });

      if (response.success) {
        alert('Pembayaran berhasil diverifikasi!');
        // Refresh list
        await fetchPendingPayments();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = rejectionReason[paymentId];
    if (!reason) {
      alert('Silakan masukkan alasan penolakan');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menolak pembayaran ini?')) {
      return;
    }

    try {
      setProcessing(paymentId);
      setError('');

      const response = await fetcher<{ success: boolean; message: string }>(`/manual-payment/admin/reject/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      if (response.success) {
        alert('Pembayaran ditolak');
        // Refresh list
        await fetchPendingPayments();
        // Clear rejection reason
        setRejectionReason((prev) => {
          const newState = { ...prev };
          delete newState[paymentId];
          return newState;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Verifikasi Pembayaran Manual
          </h1>
          <p className="text-gray-600 mt-2">
            {payments.length} pembayaran menunggu verifikasi
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Payments List */}
        {payments.length === 0 ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak Ada Pembayaran Pending
            </h3>
            <p className="text-gray-600">
              Semua pembayaran sudah diverifikasi
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {payments.map((payment) => {
              const metadata = payment.meta ? JSON.parse(payment.meta) : {};
              
              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Order Info */}
                    <div className="lg:col-span-1">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Informasi Pesanan
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Order:</span>
                          <p className="font-mono font-medium">
                            {payment.order.orderNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <p className="font-medium">
                            {payment.order.address.receiver}
                          </p>
                          <p className="text-gray-600">
                            {payment.order.address.phone}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(payment.amount)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Upload:</span>
                          <p className="text-gray-900">
                            {new Date(payment.createdAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                        {metadata.accountName && (
                          <div>
                            <span className="text-gray-600">Pengirim:</span>
                            <p className="font-medium">{metadata.accountName}</p>
                          </div>
                        )}
                        {metadata.transferDate && (
                          <div>
                            <span className="text-gray-600">Tgl Transfer:</span>
                            <p className="text-gray-900">{metadata.transferDate}</p>
                          </div>
                        )}
                        {metadata.notes && (
                          <div>
                            <span className="text-gray-600">Catatan:</span>
                            <p className="text-gray-900">{metadata.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Proof Image */}
                    <div className="lg:col-span-1">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Bukti Transfer
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={payment.proofImageUrl}
                          alt="Bukti Transfer"
                          className="w-full h-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" fill="%23999" text-anchor="middle" dy=".3em"%3EGambar tidak dapat dimuat%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      <a
                        href={payment.proofImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Buka gambar di tab baru →
                      </a>
                    </div>

                    {/* Right: Actions */}
                    <div className="lg:col-span-1">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Aksi
                      </h3>
                      <div className="space-y-3">
                        {/* Verify Button */}
                        <button
                          onClick={() => handleVerify(payment.id)}
                          disabled={processing === payment.id}
                          className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing === payment.id
                            ? 'Memproses...'
                            : '✓ Verifikasi & Terima'}
                        </button>

                        {/* Reject Input */}
                        <div className="border-t pt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alasan Penolakan:
                          </label>
                          <textarea
                            value={rejectionReason[payment.id] || ''}
                            onChange={(e) =>
                              setRejectionReason((prev) => ({
                                ...prev,
                                [payment.id]: e.target.value,
                              }))
                            }
                            placeholder="Contoh: Nominal tidak sesuai, bukti tidak jelas, dll."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            onClick={() => handleReject(payment.id)}
                            disabled={
                              processing === payment.id ||
                              !rejectionReason[payment.id]
                            }
                            className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === payment.id
                              ? 'Memproses...'
                              : '✗ Tolak Pembayaran'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchPendingPayments}
            disabled={loading}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Memuat...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
