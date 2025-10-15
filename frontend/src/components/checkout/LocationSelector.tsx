'use client';

import { useProvinces, useCities, useSubdistricts } from '@/hooks/useLocations';

interface LocationSelectorProps {
  provinceId: string;
  cityId: string;
  subdistrictId: string;
  onProvinceChange: (id: string) => void;
  onCityChange: (id: string) => void;
  onSubdistrictChange: (id: string) => void;
  disabled?: boolean;
}

export function LocationSelector({
  provinceId,
  cityId,
  subdistrictId,
  onProvinceChange,
  onCityChange,
  onSubdistrictChange,
  disabled = false,
}: LocationSelectorProps) {
  const { provinces, loading: provincesLoading } = useProvinces();
  const { cities, loading: citiesLoading } = useCities(provinceId);
  const { subdistricts, loading: subdistrictsLoading } = useSubdistricts(cityId);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvinceId = e.target.value;
    onProvinceChange(newProvinceId);
    onCityChange('');
    onSubdistrictChange('');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCityId = e.target.value;
    onCityChange(newCityId);
    onSubdistrictChange('');
  };

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSubdistrictChange(e.target.value);
  };

  return (
    <>
      {/* Province Select */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Provinsi *
        </label>
        <select
          value={provinceId}
          onChange={handleProvinceChange}
          disabled={disabled || provincesLoading}
          className="input-field"
          required
        >
          <option value="">
            {provincesLoading ? 'Memuat provinsi...' : 'Pilih provinsi'}
          </option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
      </div>

      {/* City Select */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Kota/Kabupaten *
        </label>
        <select
          value={cityId}
          onChange={handleCityChange}
          disabled={disabled || !provinceId || citiesLoading}
          className="input-field"
          required
        >
          <option value="">
            {citiesLoading
              ? 'Memuat kota...'
              : !provinceId
              ? 'Pilih provinsi terlebih dahulu'
              : 'Pilih kota/kabupaten'}
          </option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.type} {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subdistrict Select */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Kecamatan *
        </label>
        <select
          value={subdistrictId}
          onChange={handleSubdistrictChange}
          disabled={disabled || !cityId || subdistrictsLoading}
          className="input-field"
          required
        >
          <option value="">
            {subdistrictsLoading
              ? 'Memuat kecamatan...'
              : !cityId
              ? 'Pilih kota terlebih dahulu'
              : 'Pilih kecamatan'}
          </option>
          {subdistricts.map((subdistrict) => (
            <option key={subdistrict.id} value={subdistrict.id}>
              {subdistrict.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
