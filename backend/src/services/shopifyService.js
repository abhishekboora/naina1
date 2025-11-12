import { shopifyAPI } from '../vendors/shopifyAPI.js';
import Product from '../models/Product.js';

/**
 * Shopify Service - Handles real-time product syncing and Shopify operations
 */
export class ShopifyService {
  constructor() {
    this.lastSyncTime = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutes
    this.isEnabled = false;
    this.syncInProgress = false;
  }

  /**
   * Initialize Shopify service
   */
  async initialize() {
    console.log('\n🏪 Initializing Shopify Service...');
    
    // Check if credentials are configured
    if (!process.env.SHOPIFY_STORE || !process.env.SHOPIFY_ACCESS_TOKEN) {
      console.warn('⚠️  Shopify credentials not configured. Falling back to local database.');
      this.isEnabled = false;
      return false;
    }

    try {
      // Test connection
      const isConnected = await shopifyAPI.testConnection();
      if (isConnected) {
        this.isEnabled = true;
        console.log('✅ Shopify service enabled');
        return true;
      }
    } catch (error) {
      console.warn('⚠️  Could not connect to Shopify:', error.message);
      this.isEnabled = false;
    }

    return false;
  }

  /**
   * Sync all products from Shopify to MongoDB
   */
  async syncAllProducts() {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return 0;
    }

    if (!this.isEnabled) {
      console.log('ℹ️  Shopify sync disabled, using local products');
      return 0;
    }

    this.syncInProgress = true;
    console.log('\n🔄 Starting Shopify product sync...');

    try {
      let allProducts = [];
      let after = null;
      let page = 0;

      // Paginate through all products
      while (true) {
        page++;
        console.log(`   📄 Fetching page ${page}...`);
        
        const { products, page_info } = await shopifyAPI.getProducts(250, after);
        
        if (!products || products.length === 0) {
          break;
        }

        allProducts = [...allProducts, ...products];
        console.log(`   ✓ Got ${products.length} products (total: ${allProducts.length})`);

        // Check if there are more pages
        if (!page_info?.next) {
          break;
        }

        // Parse cursor from page_info
        const nextParams = new URL(page_info.next).searchParams;
        after = nextParams.get('after');
      }

      // Upsert all products to MongoDB
      let syncedCount = 0;
      for (const shopifyProduct of allProducts) {
        const result = await this.upsertProduct(shopifyProduct);
        if (result.modifiedCount > 0 || result.upsertedCount > 0) {
          syncedCount++;
        }
      }

      this.lastSyncTime = Date.now();
      console.log(`\n✅ Sync complete: ${allProducts.length} total products, ${syncedCount} updated\n`);
      
      return allProducts.length;

    } catch (error) {
      console.error('❌ Shopify sync error:', error.message);
      return 0;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Real-time product search - Shopify first, fallback to local DB
   */
  async searchProducts(query, limit = 5) {
    console.log(`\n🔍 Searching for: "${query}"`);

    // Try Shopify first if enabled
    if (this.isEnabled) {
      try {
        const shopifyProducts = await shopifyAPI.searchProducts(query, limit);
        
        if (shopifyProducts.length > 0) {
          const formatted = shopifyProducts.map(p => this.formatProductForChat(p));
          console.log(`   ✓ Found ${formatted.length} products on Shopify`);
          return formatted;
        }
      } catch (error) {
        console.warn('⚠️  Shopify search failed, trying local database:', error.message);
      }
    }

    // Fallback to local database
    return await this.searchLocalProducts(query, limit);
  }

  /**
   * Search products in local MongoDB
   */
  async searchLocalProducts(query, limit = 5) {
    try {
      const keywords = query.split(' ').filter(k => k.length > 2);
      
      const products = await Product.find({
        $and: [
          { inStock: true },
          {
            $or: [
              { name: { $regex: keywords.join('|'), $options: 'i' } },
              { description: { $regex: keywords.join('|'), $options: 'i' } },
              { category: { $regex: keywords.join('|'), $options: 'i' } },
              { tags: { $in: keywords } }
            ]
          }
        ]
      })
        .sort({ rating: -1 })
        .limit(limit)
        .lean();

      console.log(`   ✓ Found ${products.length} products in local database`);
      return products;

    } catch (error) {
      console.error('❌ Local search error:', error.message);
      return [];
    }
  }

  /**
   * Format Shopify product for chat display
   */
  formatProductForChat(shopifyProduct) {
    const variant = shopifyProduct.variants?.[0];
    
    return {
      id: shopifyProduct.id,
      name: shopifyProduct.title,
      description: this.cleanHTML(shopifyProduct.body_html),
      price: parseFloat(variant?.price || 0),
      image: shopifyProduct.image?.src || shopifyProduct.featured_image?.src,
      inStock: (variant?.inventory_quantity || 0) > 0,
      rating: 4.5,
      url: `https://${process.env.SHOPIFY_STORE}/products/${shopifyProduct.handle}`,
      source: 'shopify',
      shopifyId: shopifyProduct.id,
      inventory: variant?.inventory_quantity || 0,
      sku: variant?.sku,
      category: shopifyProduct.product_type,
      tags: shopifyProduct.tags?.split(',') || []
    };
  }

  /**
   * Clean HTML from product description
   */
  cleanHTML(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .trim()
      .substring(0, 500);
  }

  /**
   * Upsert product to MongoDB
   */
  async upsertProduct(shopifyProduct) {
    try {
      const variant = shopifyProduct.variants?.[0];
      
      const update = {
        shopifyId: shopifyProduct.id,
        name: shopifyProduct.title,
        description: this.cleanHTML(shopifyProduct.body_html),
        price: parseFloat(variant?.price || 0),
        image: shopifyProduct.image?.src || shopifyProduct.featured_image?.src,
        inStock: (variant?.inventory_quantity || 0) > 0,
        category: shopifyProduct.product_type,
        tags: shopifyProduct.tags?.split(',').filter(Boolean) || [],
        inventory: variant?.inventory_quantity || 0,
        sku: variant?.sku,
        url: `https://${process.env.SHOPIFY_STORE}/products/${shopifyProduct.handle}`,
        syncedAt: new Date()
      };

      const result = await Product.updateOne(
        { shopifyId: shopifyProduct.id },
        update,
        { upsert: true }
      );

      return result;

    } catch (error) {
      console.error(`❌ Error upserting product ${shopifyProduct.title}:`, error.message);
      throw error;
    }
  }

  /**
   * Get product details
   */
  async getProductDetails(shopifyId) {
    try {
      if (this.isEnabled) {
        const product = await shopifyAPI.getProduct(shopifyId);
        return this.formatProductForChat(product);
      }

      // Fallback to local
      return await Product.findOne({ shopifyId }).lean();

    } catch (error) {
      console.error('❌ Error getting product details:', error.message);
      return null;
    }
  }

  /**
   * Get inventory status
   */
  async checkInventory(shopifyId) {
    try {
      if (this.isEnabled) {
        const product = await shopifyAPI.getProduct(shopifyId);
        const variant = product.variants?.[0];
        return {
          available: (variant?.inventory_quantity || 0) > 0,
          quantity: variant?.inventory_quantity || 0,
          sku: variant?.sku
        };
      }

      // Fallback to local
      const product = await Product.findOne({ shopifyId }).lean();
      return {
        available: product?.inStock || false,
        quantity: product?.inventory || 0,
        sku: product?.sku
      };

    } catch (error) {
      console.error('❌ Error checking inventory:', error.message);
      return { available: false, quantity: 0 };
    }
  }

  /**
   * Get customer info from Shopify
   */
  async getCustomer(email) {
    try {
      if (!this.isEnabled) return null;
      return await shopifyAPI.getCustomer(email);
    } catch (error) {
      console.error('❌ Error getting customer:', error.message);
      return null;
    }
  }

  /**
   * Create draft order for customer
   */
  async createDraftOrder(email, products, note = '') {
    try {
      if (!this.isEnabled) {
        throw new Error('Shopify service not enabled');
      }

      const customer = await shopifyAPI.getCustomer(email);
      
      const lineItems = products.map(p => ({
        variant_id: p.variantId,
        quantity: p.quantity
      }));

      const draftOrder = await shopifyAPI.createDraftOrder({
        customer: customer ? { id: customer.id } : { email },
        line_items: lineItems,
        note: note || `Order created by Naina chatbot`
      });

      return draftOrder;

    } catch (error) {
      console.error('❌ Error creating draft order:', error.message);
      throw error;
    }
  }

  /**
   * Start auto-sync of products
   */
  startAutoSync() {
    if (!this.isEnabled) {
      console.log('ℹ️  Auto-sync disabled (Shopify not configured)');
      return;
    }

    console.log('⏰ Starting Shopify auto-sync (every 5 minutes)...');
    
    // Initial sync immediately
    this.syncAllProducts().catch(console.error);

    // Periodic sync
    setInterval(() => {
      this.syncAllProducts().catch(console.error);
    }, this.syncInterval);
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      lastSync: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      synceInterval: `${this.syncInterval / 60000} minutes`
    };
  }
}

// Export singleton instance
export const shopifyService = new ShopifyService();
