'use client';

import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { formatPrice } from '@/lib/formatting';
import { Courier, CourierService } from '@/types/dto';

interface CourierSelectorProps {
  origin: string; // City ID for origin
  destination: string; // Subdistrict ID for destination
  weight: number; // Weight in grams
  onSelect: (courier: string, service: string, cost: number, etd: string) => void;
  selectedCourier?: string;
  selectedService?: string;
}

export function CourierSelector({
  origin,
  destination,
  weight,
  onSelect,
  selectedCourier,
  selectedService,
}: CourierSelectorProps) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!origin || !destination || !weight) {
      setCouriers([]);
      return;
    }

    const fetchShippingCosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetcher<{
          success: boolean;
          data: {
            origin: string;
            destination: string;
            weight: number;
            couriers: Courier[];
          };
        }>('/api/shipping/cost', {
          method: 'POST',
          body: {
            origin,
            destination,
            weight,
            couriers: ['jne', 'tiki', 'pos'],
          },
        });

        setCouriers(response.data.couriers);
      } catch (err: any) {
        setError(err.message || 'Gagal menghitung ongkos kirim');
        setCouriers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingCosts();
  }, [origin, destination, weight]);

  const handleSelect = (courier: Courier, service: CourierService) => {
    onSelect(courier.code, service.service, service.cost, service.etd);
  };

  const isSelected = (courierCode: string, serviceCode: string) => {
    return selectedCourier === courierCode && selectedService === serviceCode;
  };

  if (!origin || !destination || !weight) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-gray-600">
          Lengkapi alamat pengiriman terlebih dahulu untuk melihat pilihan kurir
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-primary border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Menghitung ongkos kirim...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (couriers.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">Tidak ada layanan pengiriman tersedia</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {couriers.map((courier) => (
        <div key={courier.code} className="rounded-lg border border-gray-200 bg-white p-4">
          {/* Courier Header */}
          <div className="mb-3 flex items-center border-b border-gray-100 pb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <span className="text-sm font-bold uppercase text-gray-700">
                {courier.code}
              </span>
            </div>
            <div className="ml-3">
              <h4 className="font-semibold text-gray-900">{courier.name}</h4>
              <p className="text-xs text-gray-500">{courier.services.length} layanan tersedia</p>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-2">
            {courier.services.map((service) => (
              <button
                key={service.service}
                type="button"
                onClick={() => handleSelect(courier, service)}
                className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                  isSelected(courier.code, service.service)
                    ? 'border-pink-primary bg-pink-light/20'
                    : 'border-gray-200 hover:border-pink-primary/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-900">{service.service}</span>
                      {isSelected(courier.code, service.service) && (
                        <svg
                          className="ml-2 h-5 w-5 text-pink-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{service.description}</p>
                    {service.note && (
                      <p className="mt-1 text-xs italic text-gray-500">{service.note}</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="font-bold text-purple-deep">{formatPrice(service.cost)}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Estimasi {service.etd} hari
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Info */}
      <div className="rounded-lg bg-blue-50 p-3">
        <div className="flex items-start">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-2 text-xs text-blue-700">
            <p className="font-medium">Catatan:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Estimasi waktu pengiriman dapat berubah tergantung kondisi</li>
              <li>Berat paket: {(weight / 1000).toFixed(2)} kg</li>
              <li>Pilih layanan yang sesuai dengan kebutuhan Anda</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
