import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Core product info
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  description: { 
    type: String,
    default: '' 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Product organization
  category: { 
    type: String, 
    required: true,
    index: true 
  },
  tags: [{ 
    type: String 
  }],
  
  // Media
  image: { 
    type: String,
    default: ''
  },
  images: [{ 
    type: String 
  }],
  
  // Inventory
  inStock: { 
    type: Boolean, 
    default: true,
    index: true 
  },
  quantity: {
    type: Number,
    default: 0
  },
  
  // Pricing
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  compareAtPrice: {
    type: Number
  },
  
  // Product details
  sizes: [{ 
    type: String 
  }],
  colors: [{ 
    type: String 
  }],
  material: String,
  occasion: String,
  
  // Ratings
  rating: { 
    type: Number, 
    default: 4.5,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  
  // URLs
  url: { 
    type: String 
  },
  
  // External reference (for data sync)
  externalId: { 
    type: String,
    sparse: true,
    index: true
  },
  
  // ✅ NEW: Shopify-specific fields
  shopifyId: { 
    type: String,
    sparse: true,
    index: true
  },
  shopifyHandle: {
    type: String,
    sparse: true
  },
  shopifyProductType: {
    type: String
  },
  shopifyVendor: {
    type: String
  },
  variants: [{
    id: String,
    title: String,
    price: Number,
    compareAtPrice: Number,
    available: Boolean,
    sku: String,
    barcode: String,
    weight: Number,
    weightUnit: String,
    inventoryQuantity: Number,
    inventoryPolicy: String,
    requiresShipping: Boolean,
    taxable: Boolean,
    selectedOptions: [{
      name: String,
      value: String
    }]
  }],
  
  // Sync tracking
  syncedAt: { 
    type: Date 
  },
  syncSource: {
    type: String,
    enum: ['manual', 'shopify', 'api', 'import'],
    default: 'manual'
  },
  
  // Metadata
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true, // Auto-manage createdAt and updatedAt
  strict: false // ✅ Allow additional fields (for flexibility)
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, inStock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ shopifyId: 1 }, { sparse: true });
productSchema.index({ externalId: 1 }, { sparse: true });

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for full image URL
productSchema.virtual('fullImageUrl').get(function() {
  if (this.image && !this.image.startsWith('http')) {
    return `https://cdn.shopify.com/s/files/1/${this.image}`;
  }
  return this.image;
});

// Method to get display price
productSchema.methods.getDisplayPrice = function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
};

// Method to check if product has variants
productSchema.methods.hasVariants = function() {
  return this.variants && this.variants.length > 0;
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category, options = {}) {
  const query = { 
    category: new RegExp(category, 'i'),
    inStock: true
  };
  
  return this.find(query)
    .sort(options.sort || { rating: -1 })
    .limit(options.limit || 10);
};

// Static method to search products
productSchema.statics.search = function(searchTerm, options = {}) {
  return this.find(
    { $text: { $search: searchTerm }, inStock: true },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(options.limit || 10);
};

export default mongoose.model('Product', productSchema);
