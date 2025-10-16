'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/formatting';
import { ROUTES } from '@/lib/constants';
import { useCartStore } from '@/store/cart';
import { LocationSelector } from '@/components/checkout/LocationSelector';
import { CourierSelector } from '@/components/checkout/CourierSelector';

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

// Origin city ID (Yogyakarta as default)
const ORIGIN_CITY_ID = '501';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Address form state
  const [addressForm, setAddressForm] = useState({
    receiverName: '',
    phone: '',
    provinceId: '',
    cityId: '',
    subdistrictId: '',
    postalCode: '',
    address: '',
    notes: '',
  });

  // Shipping state
  const [shippingData, setShippingData] = useState({
    courier: '',
    service: '',
    cost: 0,
    etd: '',
  });

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('');

  // Calculate total weight from cart items
  const totalWeight = useMemo(() => {
    // Assuming each product has baseWeightGram
    // For demo, use 500g per item
    return items.reduce((total, item) => total + (500 * item.qty), 0);
  }, [items]);

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
    if (!shippingData.courier || !paymentMethod) {
      alert('Mohon lengkapi semua informasi');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get subdistrictName from location data (we need to fetch it)
      const subdistrictResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/locations/subdistricts/${addressForm.cityId}`
      );
      const subdistrictData = await subdistrictResponse.json();
      const selectedSubdistrict = subdistrictData.data?.subdistricts?.find(
        (s: any) => s.id === addressForm.subdistrictId
      );

      // Prepare order data
      const orderData = {
        items: items.map((item: any) => ({
          variantId: item.variant.id,
          qty: item.qty,
        })),
        shippingAddress: {
          receiverName: addressForm.receiverName,
          phone: addressForm.phone,
          provinceId: addressForm.provinceId,
          provinceName: 'Province', // TODO: Get from state
          cityId: addressForm.cityId,
          cityName: 'City', // TODO: Get from state
          subdistrictId: addressForm.subdistrictId,
          subdistrictName: selectedSubdistrict?.name || 'Subdistrict',
          postalCode: addressForm.postalCode || '',
          address: addressForm.address,
          notes: addressForm.notes || '',
        },
        shippingMethod: {
          courier: shippingData.courier,
          service: shippingData.service,
          cost: shippingData.cost,
          etd: shippingData.etd || '',
        },
        paymentMethod,
        voucherCode: undefined, // TODO: Add voucher support
      };

      // Create order
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create order');
      }

      // Clear cart
      // TODO: Call cart clear API

      // Redirect to appropriate payment page
      if (result.data.payment.method === 'MANUAL_TRANSFER') {
        // Redirect to manual payment upload page
        window.location.href = `/payment/manual/${result.data.payment.reference}`;
      } else {
        // Redirect to Tripay payment instructions
        window.location.href = `/payment/${result.data.payment.reference}`;
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert(error instanceof Error ? error.message : 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
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

                  {/* Location Selector with RajaOngkir */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <LocationSelector
                      provinceId={addressForm.provinceId}
                      cityId={addressForm.cityId}
                      subdistrictId={addressForm.subdistrictId}
                      onProvinceChange={(id) => setAddressForm({ ...addressForm, provinceId: id })}
                      onCityChange={(id) => setAddressForm({ ...addressForm, cityId: id })}
                      onSubdistrictChange={(id) => setAddressForm({ ...addressForm, subdistrictId: id })}
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
                
                <CourierSelector
                  origin={ORIGIN_CITY_ID}
                  destination={addressForm.subdistrictId}
                  weight={totalWeight}
                  onSelect={(courier, service, cost, etd) => {
                    setShippingData({ courier, service, cost, etd });
                  }}
                  selectedCourier={shippingData.courier}
                  selectedService={shippingData.service}
                />
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

                {/* Payment Method Selection */}
                <div className="rounded-xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold text-gray-900">Metode Pembayaran</h2>
                  <div className="space-y-3">
                    {/* Virtual Account Options */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Virtual Account</h3>
                      <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-primary hover:bg-pink-light/30 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BRIVA"
                          checked={paymentMethod === 'BRIVA'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-pink-primary"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600">
                            BRI
                          </div>
                          <span className="font-medium text-gray-900">BRI Virtual Account</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-primary hover:bg-pink-light/30 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="BNIVA"
                          checked={paymentMethod === 'BNIVA'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-pink-primary"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600">
                            BNI
                          </div>
                          <span className="font-medium text-gray-900">BNI Virtual Account</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-primary hover:bg-pink-light/30 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="MANDIRIVA"
                          checked={paymentMethod === 'MANDIRIVA'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-pink-primary"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600">
                            MANDIRI
                          </div>
                          <span className="font-medium text-gray-900">Mandiri Virtual Account</span>
                        </div>
                      </label>
                    </div>

                    {/* E-Wallet Options */}
                    <div className="space-y-2 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">E-Wallet</h3>
                      <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-primary hover:bg-pink-light/30 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="QRIS"
                          checked={paymentMethod === 'QRIS'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-pink-primary"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600">
                            QRIS
                          </div>
                          <span className="font-medium text-gray-900">QRIS (Semua E-Wallet)</span>
                        </div>
                      </label>
                    </div>

                    {/* Manual Transfer Option */}
                    <div className="space-y-2 pt-4 border-t">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Transfer Bank Manual</h3>
                      <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-pink-primary hover:bg-pink-light/30 transition-colors">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="MANUAL_TRANSFER"
                          checked={paymentMethod === 'MANUAL_TRANSFER'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-pink-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-semibold text-gray-600">
                              BANK
                            </div>
                            <span className="font-medium text-gray-900">Transfer Bank Manual</span>
                          </div>
                          <p className="text-xs text-gray-600 ml-15">
                            Transfer manual ke rekening toko, upload bukti transfer untuk verifikasi
                          </p>
                        </div>
                      </label>
                    </div>

                    {!paymentMethod && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Pilih metode pembayaran untuk melanjutkan
                      </p>
                    )}
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
                  disabled={
                    (currentStep === 1 && 
                      (!addressForm.receiverName || 
                       !addressForm.phone || 
                       !addressForm.provinceId || 
                       !addressForm.cityId || 
                       !addressForm.subdistrictId || 
                       !addressForm.address)) ||
                    (currentStep === 2 && !shippingData.courier)
                  }
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lanjutkan →
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  disabled={isProcessing || !paymentMethod}
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
                  {shippingData.cost > 0 ? (
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatPrice(shippingData.cost)}</div>
                      <div className="text-xs text-gray-500">
                        {shippingData.courier.toUpperCase()} {shippingData.service}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm italic text-gray-400">Belum dipilih</span>
                  )}
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Diskon</span>
                  <span>-</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-purple-deep">
                      {formatPrice(subtotal + shippingData.cost)}
                    </span>
                  </div>
                  {shippingData.cost > 0 && shippingData.etd && (
                    <p className="mt-2 text-xs text-gray-500">
                      Estimasi tiba: {shippingData.etd} hari
                    </p>
                  )}
                </div>
              </div>

              {/* Shipping Info */}
              {shippingData.cost > 0 && (
                <div className="mt-4 rounded-lg bg-green-50 p-3">
                  <div className="flex items-start">
                    <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-2 text-xs text-green-700">
                      <p className="font-medium">Metode pengiriman dipilih</p>
                      <p className="mt-1">
                        Paket Anda akan dikirim dengan {shippingData.courier.toUpperCase()} layanan {shippingData.service}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 2 Features Info */}
              <div className="mt-6 rounded-lg bg-pink-light/30 p-4">
                <h4 className="mb-2 text-sm font-semibold text-purple-deep">Phase 2 Active:</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="mr-2">✅</span>
                    <span>RajaOngkir shipping calculation</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">�</span>
                    <span>Tripay payment gateway (coming soon)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔜</span>
                    <span>Manual bank transfer</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔜</span>
                    <span>Voucher codes</span>
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
