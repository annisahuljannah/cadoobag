'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PaymentTransaction } from '@/types/dto';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params.reference as string;

  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Fetch payment details
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const response = await fetcher<{ success: boolean; data: { transaction: PaymentTransaction } }>(
          `/api/payments/tripay/${reference}`
        );
        
        if (response.success && response.data.transaction) {
          setPayment(response.data.transaction);
          const expiredTime = response.data.transaction.expired_time * 1000; // Convert to ms
          setTimeLeft(Math.max(0, expiredTime - Date.now()));
        } else {
          setError('Payment not found');
        }
      } catch (err) {
        console.error('Failed to fetch payment:', err);
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    if (reference) {
      fetchPayment();
    }
  }, [reference]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto refresh payment status every 10 seconds
  useEffect(() => {
    if (!payment || payment.status !== 'UNPAID') return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetcher<{ success: boolean; data: { transaction: PaymentTransaction } }>(
          `/api/payments/tripay/${reference}`
        );
        
        if (response.success && response.data.transaction) {
          setPayment(response.data.transaction);
          
          // If payment is completed, redirect to order page
          if (response.data.transaction.status === 'PAID') {
            setTimeout(() => {
              router.push(`/orders/${response.data.transaction.merchant_ref}`);
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Failed to refresh payment status:', err);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [payment, reference, router]);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format time left
  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return 'Expired';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      REFUND: 'bg-purple-100 text-purple-800',
    };

    const labels = {
      UNPAID: 'Menunggu Pembayaran',
      PAID: 'Pembayaran Berhasil',
      FAILED: 'Pembayaran Gagal',
      EXPIRED: 'Pembayaran Kadaluarsa',
      REFUND: 'Pembayaran Dikembalikan',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.UNPAID}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-pink-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat detail pembayaran...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">{error || 'Data pembayaran tidak dapat ditemukan'}</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-2 bg-pink-primary text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Detail Pembayaran</h1>
        <p className="text-gray-600">Selesaikan pembayaran sebelum waktu habis</p>
      </div>

      {/* Status Banner */}
      {payment.status === 'PAID' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-green-900">Pembayaran Berhasil!</h3>
              <p className="text-green-700">Terima kasih, pembayaran Anda telah kami terima.</p>
            </div>
          </div>
        </div>
      )}

      {payment.status === 'EXPIRED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-gray-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pembayaran Kadaluarsa</h3>
              <p className="text-gray-700">Waktu pembayaran telah habis. Silakan buat pesanan baru.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Info Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Informasi Pembayaran</h2>
              {getStatusBadge(payment.status)}
            </div>

            <div className="space-y-4">
              {/* Order Number */}
              <div>
                <label className="text-sm text-gray-600">Nomor Pesanan</label>
                <p className="text-lg font-mono font-semibold text-gray-900">{payment.merchant_ref}</p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-sm text-gray-600">Metode Pembayaran</label>
                <p className="text-lg font-semibold text-gray-900">{payment.payment_name}</p>
              </div>

              {/* Payment Code (VA/QRIS) */}
              {payment.pay_code && (
                <div>
                  <label className="text-sm text-gray-600">
                    {payment.payment_method.includes('QRIS') ? 'Kode QRIS' : 'Nomor Virtual Account'}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-mono font-bold text-pink-primary">{payment.pay_code}</p>
                    <button
                      onClick={() => copyToClipboard(payment.pay_code!)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Salin"
                    >
                      {copied ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* QRIS Image */}
              {payment.qr_url && (
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Scan QR Code</label>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block">
                    <img src={payment.qr_url} alt="QRIS Code" className="w-64 h-64" />
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(payment.amount)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className="font-semibold">{formatPrice(payment.fee_customer)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total Pembayaran</span>
                  <span className="text-pink-primary">{formatPrice(payment.amount_received)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          {payment.instructions && payment.instructions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cara Pembayaran</h2>
              <div className="space-y-6">
                {payment.instructions.map((instruction, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-gray-900 mb-3">{instruction.title}</h3>
                    <ol className="space-y-2">
                      {instruction.steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-pink-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {stepIdx + 1}
                          </span>
                          <span className="text-gray-700 flex-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timer Card */}
          {payment.status === 'UNPAID' && (
            <div className="bg-gradient-to-br from-pink-primary to-purple-deep text-white rounded-lg p-6">
              <h3 className="text-sm font-medium mb-2 opacity-90">Selesaikan Pembayaran Dalam</h3>
              <div className="text-4xl font-bold mb-2">{formatTimeLeft(timeLeft)}</div>
              <p className="text-sm opacity-90">
                Pembayaran akan otomatis dibatalkan jika waktu habis
              </p>
            </div>
          )}

          {/* Help Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Butuh Bantuan?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hubungi customer service kami jika ada kendala dalam proses pembayaran
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">hello@cadoobag.com</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-700">+62 812-3456-7890</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {payment.checkout_url && payment.status === 'UNPAID' && (
              <a
                href={payment.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-pink-primary text-white text-center rounded-lg hover:bg-pink-600 transition-colors font-medium"
              >
                Buka Halaman Tripay
              </a>
            )}
            <button
              onClick={() => router.push('/products')}
              className="block w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Belanja Lagi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
