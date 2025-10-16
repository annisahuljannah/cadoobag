'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  code: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  total: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
}

export default function ManualPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const reference = params?.reference as string;

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [accountName, setAccountName] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [notes, setNotes] = useState('');
  const [copying, setCopying] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch bank accounts
        const banksResponse = await fetcher<{
          success: boolean;
          data: BankAccount[];
        }>('/manual-payment/banks');

        if (banksResponse.success) {
          setBanks(banksResponse.data);
        }

        // Fetch order details
        // For now, we'll use a mock order
        // In production, you'd fetch the actual order by reference
        setOrder({
          id: '1',
          orderNumber: reference,
          total: 150000,
          grandTotal: 150000,
          paymentMethod: 'MANUAL_TRANSFER',
          paymentStatus: 'UNPAID',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (reference) {
      fetchData();
    }
  }, [reference]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(id);
      setTimeout(() => setCopying(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageUrl || !selectedBank) {
      setError('Silakan lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const response = await fetcher<{ success: boolean; message: string }>('/manual-payment/upload-proof', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: order?.id, // In production, get actual payment ID
          imageUrl,
          accountNumber: banks.find((b) => b.id === selectedBank)?.accountNumber,
          accountName,
          transferDate,
          notes,
        }),
      });

      if (response.success) {
        alert('Bukti pembayaran berhasil diupload! Mohon tunggu verifikasi admin.');
        router.push(`/orders/${order?.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            Pesanan tidak ditemukan
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Konfirmasi Pembayaran Manual
          </h1>
          <p className="text-gray-600">
            Pesanan: <span className="font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Payment Amount */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Total Pembayaran
          </h2>
          <div className="text-3xl font-bold text-blue-600">
            {formatPrice(order.grandTotal)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Pastikan nominal transfer sesuai dengan jumlah di atas
          </p>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pilih Rekening Tujuan
          </h2>
          <div className="space-y-3">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedBank === bank.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedBank(bank.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {bank.bankName}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">No. Rekening:</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {bank.accountNumber}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(bank.accountNumber, `acc-${bank.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-xs"
                        >
                          {copying === `acc-${bank.id}` ? '✓ Tersalin' : 'Salin'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Atas Nama:</span>
                        <span className="font-medium text-gray-900">
                          {bank.accountName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedBank === bank.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedBank === bank.id && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Proof Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Bukti Transfer
            </h2>
            
            <div className="space-y-4">
              {/* Image URL Input (In production, use file upload) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Gambar Bukti Transfer *
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/bukti-transfer.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload gambar ke layanan hosting (Imgur, ImgBB, dll) dan paste URL-nya di sini
                </p>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pengirim (Opsional)
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Nama rekening pengirim"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Transfer (Opsional)
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika diperlukan"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={uploading || !imageUrl || !selectedBank}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
            </button>
          </div>
        </form>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Petunjuk:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Transfer sesuai nominal yang tertera</li>
            <li>Pilih rekening bank tujuan</li>
            <li>Upload bukti transfer (screenshot/foto)</li>
            <li>Tunggu verifikasi dari admin (maks. 1x24 jam)</li>
            <li>Pesanan akan diproses setelah pembayaran diverifikasi</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
