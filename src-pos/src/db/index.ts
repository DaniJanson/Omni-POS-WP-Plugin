import Dexie, { type Table } from 'dexie';
import type { Product, ProductCategory, Customer, PosInitData } from '../types';

export interface OfflineOrder {
  id?: number;
  created_at: number;
  payload: any;
  status: 'pending' | 'synced' | 'failed';
  error_message?: string;
}

export interface CachedMeta {
  key: string;
  value: any;
  updated_at: number;
}

export class OmniPosDatabase extends Dexie {
  products!: Table<Product, number>;
  categories!: Table<ProductCategory, number>;
  customers!: Table<Customer, number>;
  offlineOrders!: Table<OfflineOrder, number>;
  metadata!: Table<CachedMeta, string>;

  constructor() {
    super('OmniPosDB');

    this.version(1).stores({
      products: 'id, barcode, sku, name, *categories.id, in_stock, updated_at',
      categories: 'id, slug, parent',
      customers: 'id, phone, email, name',
      offlineOrders: '++id, status, created_at',
      metadata: 'key, updated_at',
    });
  }

  /**
   * Fast Barcode lookup in IndexedDB
   */
  async findByBarcode(barcode: string): Promise<Product | undefined> {
    if (!barcode) return undefined;
    const clean = barcode.trim();

    // 1. Direct barcode index match
    let product = await this.products.where('barcode').equalsIgnoreCase(clean).first();
    if (product) return product;

    // 2. Direct SKU index match
    product = await this.products.where('sku').equalsIgnoreCase(clean).first();
    if (product) return product;

    // 3. Direct ID match
    if (!isNaN(Number(clean))) {
      product = await this.products.get(Number(clean));
      if (product) return product;
    }

    // 4. Search in variations barcodes
    const allWithVariations = await this.products.filter(p => !!p.variations?.length).toArray();
    for (const p of allWithVariations) {
      if (p.variations) {
        const foundVar = p.variations.find(v => v.barcode === clean || v.sku === clean || String(v.id) === clean);
        if (foundVar) {
          return p;
        }
      }
    }

    return undefined;
  }

  /**
   * Fast full-text local search across Name, SKU, and Barcode
   */
  async searchProducts(query: string, categoryId: number = 0, limit: number = 60): Promise<Product[]> {
    const q = query.trim().toLowerCase();

    let collection = this.products.toCollection();

    let results = await collection.filter(product => {
      // Category filter
      if (categoryId > 0) {
        const hasCategory = product.categories?.some(c => c.id === categoryId);
        if (!hasCategory) return false;
      }

      // Query filter
      if (!q) return true;

      const nameMatch = product.name?.toLowerCase().includes(q);
      const skuMatch = product.sku?.toLowerCase().includes(q);
      const barcodeMatch = product.barcode?.toLowerCase().includes(q);

      return Boolean(nameMatch || skuMatch || barcodeMatch);
    }).limit(limit).toArray();

    return results;
  }

  /**
   * Get total local products count
   */
  async getProductsCount(): Promise<number> {
    return await this.products.count();
  }

  /**
   * Save or update store metadata
   */
  async saveInitData(data: PosInitData): Promise<void> {
    await this.metadata.put({
      key: 'init_data',
      value: data,
      updated_at: Date.now(),
    });
  }

  /**
   * Get cached store metadata
   */
  async getInitData(): Promise<PosInitData | null> {
    const meta = await this.metadata.get('init_data');
    return meta ? meta.value : null;
  }
}

export const db = new OmniPosDatabase();
