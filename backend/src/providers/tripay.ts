import crypto from 'crypto';
import { env } from '../env';
import { logger } from '../utils/logger';

// Types for Tripay API
export interface PaymentChannel {
  group: string;
  code: string;
  name: string;
  type: 'virtual_account' | 'convenience_store' | 'ewallet' | 'qris';
  fee_merchant: {
    flat: number;
    percent: number;
  };
  fee_customer: {
    flat: number;
    percent: number;
  };
  total_fee: {
    flat: number;
    percent: number;
  };
  minimum_fee: number;
  maximum_fee: number;
  icon_url: string;
  active: boolean;
}

export interface OrderItem {
  sku?: string;
  name: string;
  price: number;
  quantity: number;
  product_url?: string;
  image_url?: string;
}

export interface CreateTransactionParams {
  method: string; // Payment channel code
  merchant_ref: string; // Unique order reference
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_items: OrderItem[];
  return_url?: string;
  expired_time?: number; // In seconds, default 24 hours
  signature: string;
}

export interface TripayTransaction {
  reference: string; // Tripay reference
  merchant_ref: string; // Our order reference
  payment_selection_type: string;
  payment_method: string;
  payment_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  callback_url: string;
  return_url: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  pay_code?: string; // VA number, QRIS code, etc.
  pay_url?: string; // Payment URL for ewallet
  checkout_url: string;
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND';
  expired_time: number; // Unix timestamp
  order_items: OrderItem[];
  instructions: PaymentInstruction[];
  qr_code?: string; // For QRIS
  qr_url?: string; // QRIS image URL
}

export interface PaymentInstruction {
  title: string;
  steps: string[];
}

export interface TripayCallback {
  reference: string;
  merchant_ref: string;
  payment_selection_type: string;
  payment_method: string;
  payment_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  callback_url: string;
  return_url: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  is_closed_payment: number;
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND';
  paid_at: number; // Unix timestamp
}

interface TripayResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export class TripayProvider {
  private apiKey: string;
  private privateKey: string;
  private merchantCode: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = env.TRIPAY_API_KEY;
    this.privateKey = env.TRIPAY_PRIVATE_KEY;
    this.merchantCode = env.TRIPAY_MERCHANT_CODE;
    this.baseUrl = env.TRIPAY_BASE_URL;

    logger.info('Tripay provider initialized', {
      merchantCode: this.merchantCode,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Generate HMAC SHA256 signature for Tripay API
   */
  generateSignature(merchantRef: string, amount: number): string {
    const payload = this.merchantCode + merchantRef + amount;
    return crypto
      .createHmac('sha256', this.privateKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify callback signature from Tripay
   */
  verifyCallbackSignature(
    callbackSignature: string,
    json: string
  ): boolean {
    const signature = crypto
      .createHmac('sha256', this.privateKey)
      .update(json)
      .digest('hex');
    
    return signature === callbackSignature;
  }

  /**
   * Make authenticated request to Tripay API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TripayResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    try {
      logger.debug('Tripay API request', { url, method: options.method || 'GET' });
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json() as TripayResponse<T>;

      if (!response.ok) {
        logger.error('Tripay API error', {
          status: response.status,
          data,
        });
        throw new Error(data.message || 'Tripay API request failed');
      }

      logger.debug('Tripay API response', { success: data.success });
      return data;
    } catch (error) {
      logger.error('Tripay request failed', { error, endpoint });
      throw error;
    }
  }

  /**
   * Get list of available payment channels
   */
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    try {
      logger.info('Fetching payment channels from Tripay');
      
      const response = await this.request<PaymentChannel[]>(
        '/merchant/payment-channel',
        { method: 'GET' }
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch payment channels');
      }

      // Filter only active channels
      const activeChannels = response.data.filter(channel => channel.active);
      
      logger.info('Payment channels fetched', { 
        total: response.data.length,
        active: activeChannels.length 
      });

      return activeChannels;
    } catch (error) {
      logger.error('Failed to get payment channels', { error });
      throw error;
    }
  }

  /**
   * Get specific payment channel by code
   */
  async getPaymentChannel(code: string): Promise<PaymentChannel | null> {
    try {
      const channels = await this.getPaymentChannels();
      return channels.find(channel => channel.code === code) || null;
    } catch (error) {
      logger.error('Failed to get payment channel', { error, code });
      throw error;
    }
  }

  /**
   * Create payment transaction
   */
  async createTransaction(
    params: Omit<CreateTransactionParams, 'signature'>
  ): Promise<TripayTransaction> {
    try {
      // Generate signature
      const signature = this.generateSignature(params.merchant_ref, params.amount);

      // Set default expired time (24 hours)
      const expiredTime = params.expired_time || 86400; // 24 hours in seconds

      const payload: CreateTransactionParams = {
        ...params,
        signature,
        expired_time: expiredTime,
        return_url: params.return_url || `${env.FRONTEND_BASE_URL}/orders`,
      };

      logger.info('Creating Tripay transaction', {
        merchant_ref: params.merchant_ref,
        method: params.method,
        amount: params.amount,
      });

      const response = await this.request<TripayTransaction>(
        '/transaction/create',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create transaction');
      }

      logger.info('Tripay transaction created', {
        reference: response.data.reference,
        merchant_ref: response.data.merchant_ref,
        status: response.data.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create transaction', { error, params });
      throw error;
    }
  }

  /**
   * Get transaction detail by reference
   */
  async getTransactionDetail(reference: string): Promise<TripayTransaction | null> {
    try {
      logger.info('Fetching transaction detail', { reference });

      const response = await this.request<TripayTransaction>(
        `/transaction/detail?reference=${reference}`,
        { method: 'GET' }
      );

      if (!response.success || !response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to get transaction detail', { error, reference });
      return null;
    }
  }

  /**
   * Calculate payment fee for a channel
   */
  calculateFee(
    amount: number,
    channel: PaymentChannel,
    feeType: 'merchant' | 'customer' = 'customer'
  ): number {
    const fee = feeType === 'customer' ? channel.fee_customer : channel.fee_merchant;
    
    let calculatedFee = fee.flat + (amount * fee.percent / 100);
    
    // Apply minimum and maximum fee limits
    if (channel.minimum_fee && calculatedFee < channel.minimum_fee) {
      calculatedFee = channel.minimum_fee;
    }
    if (channel.maximum_fee && calculatedFee > channel.maximum_fee) {
      calculatedFee = channel.maximum_fee;
    }

    return Math.round(calculatedFee);
  }

  /**
   * Calculate total amount including fee
   */
  calculateTotalAmount(amount: number, channel: PaymentChannel): number {
    const fee = this.calculateFee(amount, channel, 'customer');
    return amount + fee;
  }
}

// Singleton instance
export const tripay = new TripayProvider();
