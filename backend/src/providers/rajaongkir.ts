import { env } from '../env';
import { logger } from '../utils/logger';

/**
 * RajaOngkir API Provider
 * Documentation: https://rajaongkir.com/dokumentasi
 */

// Types
export interface Province {
  province_id: string;
  province: string;
}

export interface City {
  city_id: string;
  province_id: string;
  province: string;
  type: string; // "Kota" or "Kabupaten"
  city_name: string;
  postal_code: string;
}

export interface Subdistrict {
  subdistrict_id: string;
  province_id: string;
  province: string;
  city_id: string;
  city: string;
  type: string;
  subdistrict_name: string;
}

export interface ShippingCost {
  code: string; // "jne", "tiki", "pos"
  name: string; // "Jalur Nugraha Ekakurir (JNE)"
  costs: Array<{
    service: string; // "REG", "YES", "OKE"
    description: string;
    cost: Array<{
      value: number;
      etd: string; // "1-2" (days)
      note: string;
    }>;
  }>;
}

interface RajaOngkirResponse<T> {
  rajaongkir: {
    query?: any;
    status: {
      code: number;
      description: string;
    };
    results: T;
  };
}

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RajaOngkirCache {
  private cache = new Map<string, CacheEntry<any>>();
  private ttl = 24 * 60 * 60 * 1000; // 24 hours

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

class RajaOngkirProvider {
  private baseURL: string;
  private apiKey: string;
  private cache: RajaOngkirCache;

  constructor() {
    this.baseURL = env.RAJAONGKIR_BASE_URL;
    this.apiKey = env.RAJAONGKIR_API_KEY;
    this.cache = new RajaOngkirCache();

    logger.info('RajaOngkir provider initialized', {
      baseURL: this.baseURL,
      apiKeyPresent: !!this.apiKey,
    });
  }

  /**
   * Make HTTP request to RajaOngkir API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`RajaOngkir API error: ${response.status} ${response.statusText}`);
      }

      const data: RajaOngkirResponse<T> = await response.json();

      // Check RajaOngkir status
      if (data.rajaongkir.status.code !== 200) {
        throw new Error(`RajaOngkir error: ${data.rajaongkir.status.description}`);
      }

      return data.rajaongkir.results;
    } catch (error: any) {
      logger.error('RajaOngkir API request failed', {
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get all provinces
   * Cached for 24 hours
   */
  async getProvinces(): Promise<Province[]> {
    const cacheKey = 'provinces';
    const cached = this.cache.get<Province[]>(cacheKey);
    if (cached) {
      logger.debug('RajaOngkir: Using cached provinces');
      return cached;
    }

    logger.info('RajaOngkir: Fetching provinces from API');
    const provinces = await this.request<Province[]>('/province');
    this.cache.set(cacheKey, provinces);
    return provinces;
  }

  /**
   * Get province by ID
   */
  async getProvince(provinceId: string): Promise<Province> {
    const provinces = await this.getProvinces();
    const province = provinces.find((p) => p.province_id === provinceId);
    if (!province) {
      throw new Error(`Province not found: ${provinceId}`);
    }
    return province;
  }

  /**
   * Get cities in a province
   * Cached for 24 hours
   */
  async getCities(provinceId: string): Promise<City[]> {
    const cacheKey = `cities_${provinceId}`;
    const cached = this.cache.get<City[]>(cacheKey);
    if (cached) {
      logger.debug('RajaOngkir: Using cached cities', { provinceId });
      return cached;
    }

    logger.info('RajaOngkir: Fetching cities from API', { provinceId });
    const cities = await this.request<City[]>(`/city?province=${provinceId}`);
    this.cache.set(cacheKey, cities);
    return cities;
  }

  /**
   * Get city by ID
   */
  async getCity(cityId: string): Promise<City> {
    const cacheKey = `city_${cityId}`;
    const cached = this.cache.get<City>(cacheKey);
    if (cached) {
      return cached;
    }

    const city = await this.request<City>(`/city?id=${cityId}`);
    this.cache.set(cacheKey, city);
    return city;
  }

  /**
   * Get subdistricts in a city
   * Cached for 24 hours
   */
  async getSubdistricts(cityId: string): Promise<Subdistrict[]> {
    const cacheKey = `subdistricts_${cityId}`;
    const cached = this.cache.get<Subdistrict[]>(cacheKey);
    if (cached) {
      logger.debug('RajaOngkir: Using cached subdistricts', { cityId });
      return cached;
    }

    logger.info('RajaOngkir: Fetching subdistricts from API', { cityId });
    const subdistricts = await this.request<Subdistrict[]>(`/subdistrict?city=${cityId}`);
    this.cache.set(cacheKey, subdistricts);
    return subdistricts;
  }

  /**
   * Calculate shipping cost
   * @param origin - Origin city ID (e.g., "501" for Yogyakarta)
   * @param destination - Destination subdistrict ID
   * @param weight - Weight in grams
   * @param courier - Courier code (e.g., "jne", "tiki", "pos")
   */
  async calculateCost(params: {
    origin: string;
    destination: string;
    weight: number;
    courier: string;
  }): Promise<ShippingCost[]> {
    const { origin, destination, weight, courier } = params;

    // Don't cache cost calculations (prices may change)
    logger.info('RajaOngkir: Calculating shipping cost', params);

    const body = new URLSearchParams({
      origin,
      originType: 'city',
      destination,
      destinationType: 'subdistrict',
      weight: weight.toString(),
      courier,
    });

    const costs = await this.request<ShippingCost[]>('/cost', {
      method: 'POST',
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return costs;
  }

  /**
   * Calculate shipping cost for multiple couriers
   */
  async calculateMultipleCosts(params: {
    origin: string;
    destination: string;
    weight: number;
    couriers?: string[]; // Default: ["jne", "tiki", "pos"]
  }): Promise<ShippingCost[]> {
    const { origin, destination, weight, couriers = ['jne', 'tiki', 'pos'] } = params;

    const results = await Promise.all(
      couriers.map((courier) =>
        this.calculateCost({ origin, destination, weight, courier })
      )
    );

    // Flatten results
    return results.flat();
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('RajaOngkir: Cache cleared');
  }
}

// Export singleton instance
export const rajaOngkir = new RajaOngkirProvider();
