'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/formatting';
import { ROUTES } from '@/lib/constants';
import { useCartStore } from '@/store/cart';

interface CheckoutStep {
  id: number;
  title: string;
  description: string;
}

const STEPS: CheckoutStep[] = [
  { id: 1, title: 'Alamat Pengiriman', description: 'Lengkapi alamat tujuan pengiriman' },
  { id: 2, title: 'Metode Pengiriman', description: 'Pilih jasa pengiriman' },
  { id: 3, title: 'Review & Pembayaran', description: 'Tinjau pesanan dan lakukan pembayaran' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    receiverName: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    postalCode: '',
    address: '',
    notes: '',
  });

  // Check if cart is empty
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Keranjang Kosong</h2>
          <p className="mb-8 text-gray-600">
            Anda belum menambahkan produk apapun ke keranjang
          </p>
          <button
            onClick={() => router.push(ROUTES.PRODUCTS)}
            className="btn-primary"
          >
            Belanja Sekarang
          </button>
        </div>
      </div>
    );
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    // TODO: Implement order submission in Phase 2
    setTimeout(() => {
      alert('Fitur pembayaran akan diintegrasikan di Phase 2 (Tripay Payment Gateway)');
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-bg py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Selesaikan pesanan Anda</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 overflow-hidden rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                      currentStep >= step.id
                        ? 'border-pink-primary bg-pink-primary text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {step.id}
                  </div>
                  
                  {/* Step Info */}
                  <div className="ml-4 hidden md:block">
                    <div className={`font-semibold ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-gray-500">{step.description}</div>
                  </div>
                </div>

                {/* Connector Line */}
                {index < STEPS.length - 1 && (
                  <div className="mx-4 flex-1">
                    <div
                      className={`h-1 rounded transition-colors ${
                        currentStep > step.id ? 'bg-pink-primary' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address Form */}
            {currentStep === 1 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-gray-900">Alamat Pengiriman</h2>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Nama Penerima *
                      </label>
                      <input
                        type="text"
                        name="receiverName"
                        value={addressForm.receiverName}
                        onChange={handleAddressChange}
                        className="input-field"
                        placeholder="Nama lengkap penerima"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={addressForm.phone}
                        onChange={handleAddressChange}
                        className="input-field"
                        placeholder="08xxxxxxxxxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Provinsi *
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={addressForm.province}
                        onChange={handleAddressChange}
                        className="input-field"
                        placeholder="Akan menggunakan RajaOngkir di Phase 2"
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        * Integrasi RajaOngkir di Phase 2
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Kota/Kabupaten *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        className="input-field"
                        placeholder="Akan menggunakan RajaOngkir di Phase 2"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Kecamatan *
                      </label>
                      <input
                        type="text"
                        name="district"
                        value={addressForm.district}
                        onChange={handleAddressChange}
                        className="input-field"
                        placeholder="Akan menggunakan RajaOngkir di Phase 2"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Kode Pos *
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={addressForm.postalCode}
                        onChange={handleAddressChange}
                        className="input-field"
                        placeholder="12345"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Alamat Lengkap *
                    </label>
                    <textarea
                      name="address"
                      value={addressForm.address}
                      onChange={handleAddressChange}
                      className="input-field min-h-[100px]"
                      placeholder="Jalan, nomor rumah, RT/RW, dll"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Catatan (Opsional)
                    </label>
                    <textarea
                      name="notes"
                      value={addressForm.notes}
                      onChange={handleAddressChange}
                      className="input-field"
                      placeholder="Catatan untuk kurir atau penjual"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 2 && (
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold text-gray-900">Metode Pengiriman</h2>
                <div className="space-y-4">
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <svg
                      className="mx-auto mb-4 h-16 w-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                      />
                    </svg>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Integrasi RajaOngkir - Phase 2
                    </h3>
                    <p className="mb-4 text-gray-600">
                      Perhitungan ongkir otomatis dengan berbagai pilihan kurir (JNE, TIKI, POS Indonesia, dll)
                      akan tersedia di Phase 2
                    </p>
                    <div className="mx-auto max-w-md space-y-2 text-left text-sm text-gray-600">
                      <div className="flex items-start">
                        <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-pink-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Real-time shipping cost calculation</span>
                      </div>
                      <div className="flex items-start">
                        <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-pink-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Multiple courier options (REG, YES, OKE, etc.)</span>
                      </div>
                      <div className="flex items-start">
                        <svg className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-pink-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Estimated delivery time</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Order Items */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Ringkasan Pesanan</h2>
                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {item.variant.color && `${item.variant.color}`}
                            {item.variant.color && item.variant.size && ' • '}
                            {item.variant.size && `Size ${item.variant.size}`}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Qty: {item.qty}</span>
                            <span className="font-semibold text-purple-deep">
                              {formatPrice(item.variant.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method Placeholder */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Metode Pembayaran</h2>
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <svg
                      className="mx-auto mb-4 h-16 w-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      Integrasi Tripay Payment Gateway - Phase 2
                    </h3>
                    <p className="text-gray-600">
                      Multiple payment channels (Virtual Account, E-Wallet, QRIS, dll) akan tersedia di Phase 2
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← Kembali
              </button>
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && (!addressForm.receiverName || !addressForm.phone || !addressForm.address)}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lanjutkan →
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={isProcessing}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-gray-900">Ringkasan Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} item)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span className="text-sm italic text-gray-400">Akan dihitung</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Diskon</span>
                  <span>-</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-purple-deep">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    * Total akhir akan termasuk ongkir setelah integrasi RajaOngkir
                  </p>
                </div>
              </div>

              {/* Phase 2 Features Info */}
              <div className="mt-6 rounded-lg bg-pink-light/30 p-4">
                <h4 className="mb-2 text-sm font-semibold text-purple-deep">Coming in Phase 2:</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">🚚</span>
                    <span>RajaOngkir shipping integration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">💳</span>
                    <span>Tripay payment gateway (VA, E-Wallet, QRIS)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🏦</span>
                    <span>Manual bank transfer option</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🎫</span>
                    <span>Voucher & discount codes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
