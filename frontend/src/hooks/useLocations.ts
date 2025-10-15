import { useState, useEffect } from 'react';
import { fetcher } from '@/lib/fetcher';
import { Province, City, Subdistrict } from '@/types/dto';

interface LocationResponse<T> {
  success: boolean;
  data: T;
}

/**
 * Hook to fetch provinces
 */
export function useProvinces() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetcher<LocationResponse<{ provinces: Province[] }>>(
          '/api/locations/provinces'
        );
        setProvinces(response.data.provinces);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch provinces');
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  return { provinces, loading, error };
}

/**
 * Hook to fetch cities by province
 */
export function useCities(provinceId: string | null) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      return;
    }

    const fetchCities = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetcher<LocationResponse<{ cities: City[] }>>(
          `/api/locations/cities/${provinceId}`
        );
        setCities(response.data.cities);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch cities');
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [provinceId]);

  return { cities, loading, error };
}

/**
 * Hook to fetch subdistricts by city
 */
export function useSubdistricts(cityId: string | null) {
  const [subdistricts, setSubdistricts] = useState<Subdistrict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cityId) {
      setSubdistricts([]);
      return;
    }

    const fetchSubdistricts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetcher<LocationResponse<{ subdistricts: Subdistrict[] }>>(
          `/api/locations/subdistricts/${cityId}`
        );
        setSubdistricts(response.data.subdistricts);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch subdistricts');
        setSubdistricts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubdistricts();
  }, [cityId]);

  return { subdistricts, loading, error };
}
