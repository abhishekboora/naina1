import Product from '../models/Product.js';
import Policy from '../models/Policy.js';
import connectDB from '../db.js';

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    await Product.deleteMany({});
    await Policy.deleteMany({});
    
    // Oment Products
    const products = [
      {
        name: 'Floral Summer Maxi Dress',
        description: 'Breezy floral print maxi dress perfect for summer outings and casual days',
        price: 1499,
        category: 'Dress',
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Pink Floral', 'Blue Floral', 'White Floral'],
        material: '100% Cotton',
        occasion: 'Casual',
        inStock: true,
        rating: 4.8,
        discount: 20
      },
      {
        name: 'Satin Party Dress',
        description: 'Elegant satin dress perfect for parties and special occasions',
        price: 2299,
        category: 'Dress',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500',
        sizes: ['S', 'M', 'L'],
        colors: ['Black', 'Burgundy', 'Emerald Green'],
        material: 'Satin Blend',
        occasion: 'Party',
        inStock: true,
        rating: 4.9,
        discount: 15
      },
      {
        name: 'Oversized Denim Jacket',
        description: 'Trendy oversized denim jacket with distressed look',
        price: 2199,
        category: 'Top',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
        sizes: ['S', 'M', 'L'],
        colors: ['Light Blue', 'Dark Blue', 'Black'],
        material: 'Premium Denim',
        occasion: 'Casual',
        inStock: true,
        rating: 4.7
      },
      {
        name: 'Crop Top & Palazzo Co-ord Set',
        description: 'Comfortable matching crop top and palazzo pants set',
        price: 1799,
        category: 'Co-ord',
        image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Peach', 'Mint Green'],
        material: 'Cotton Blend',
        occasion: 'Casual',
        inStock: true,
        rating: 4.6
      },
      {
        name: 'High-Waist Wide Leg Jeans',
        description: 'Comfortable high-waist jeans with trendy wide leg fit',
        price: 1899,
        category: 'Bottom',
        image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500',
        sizes: ['28', '30', '32', '34', '36'],
        colors: ['Blue', 'Black', 'Light Grey'],
        material: 'Stretch Denim',
        occasion: 'Casual',
        inStock: true,
        rating: 4.8
      },
      {
        name: 'Silk Crop Top',
        description: 'Luxurious silk crop top for party nights',
        price: 1299,
        category: 'Top',
        image: 'https://images.unsplash.com/photo-1564257577-3614ca9f0d5e?w=500',
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Black', 'White', 'Red'],
        material: 'Pure Silk',
        occasion: 'Party',
        inStock: true,
        rating: 4.5
      },
      {
        name: 'Ethnic Printed Kurta Set',
        description: 'Beautiful ethnic kurta with matching palazzo',
        price: 2499,
        category: 'Co-ord',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blue Print', 'Pink Print', 'Green Print'],
        material: 'Rayon',
        occasion: 'Formal',
        inStock: true,
        rating: 4.9
      },
      {
        name: 'Leather Mini Skirt',
        description: 'Edgy leather mini skirt for bold looks',
        price: 1599,
        category: 'Bottom',
        image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500',
        sizes: ['S', 'M', 'L'],
        colors: ['Black', 'Brown'],
        material: 'Faux Leather',
        occasion: 'Party',
        inStock: true,
        rating: 4.6
      },
      {
        name: 'Linen Button-Down Shirt',
        description: 'Breezy linen shirt for everyday comfort',
        price: 1199,
        category: 'Top',
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Beige', 'Sky Blue'],
        material: 'Pure Linen',
        occasion: 'Casual',
        inStock: true,
        rating: 4.7
      },
      {
        name: 'Sequin Party Dress',
        description: 'Glamorous sequin dress to shine at parties',
        price: 2999,
        category: 'Dress',
        image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500',
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Gold', 'Silver', 'Rose Gold'],
        material: 'Sequin Fabric',
        occasion: 'Party',
        inStock: true,
        rating: 5.0,
        discount: 10
      }
    ];

    await Product.insertMany(products);
    console.log(`✅ Oment Products seeded: ${products.length}`);

    // Oment Policies
    const policies = [
      {
        type: 'shipping',
        title: 'Shipping & Delivery',
        content: `
📦 SHIPPING POLICY

• Free shipping on orders above ₹999
• Standard delivery: 2-4 business days
• Express delivery available in select cities (1-2 days)
• Delivered to your doorstep with tracking
• All orders shipped from Oment warehouse in Mumbai
• SMS & Email updates at every step
• Safe contactless delivery available

Track your order anytime at www.oment.store/track
        `
      },
      {
        type: 'return',
        title: 'Returns & Exchange',
        content: `
🔄 RETURN & EXCHANGE POLICY

• 7-day easy returns from delivery date
• No questions asked refund policy
• Free pickup arranged by Oment
• Exchanges available for different size/color
• Refund processed within 5-7 business days
• Original tags and packaging required
• Return pickup scheduled within 24 hours

To initiate return: My Orders > Select Item > Return/Exchange
        `
      },
      {
        type: 'cod',
        title: 'Cash on Delivery',
        content: `
💰 COD AVAILABLE

• FREE Cash on Delivery on ALL orders
• No extra charges for COD
• Pay in cash when product is delivered
• Other payment options: Card, UPI, Net Banking
• 100% secure payment gateway
• Check product before payment
• Easy returns even on COD orders
        `
      },
      {
        type: 'contact',
        title: 'Contact & Support',
        content: `
💬 CONTACT OMENT SUPPORT

Email: support@oment.store
WhatsApp: +91-XXXXXXXXXX
Phone: 1800-XXX-XXXX (Toll Free)

Working Hours: 9 AM - 7 PM (Mon-Sat)

Quick Links:
• Track Order: www.oment.store/track
• Size Guide: www.oment.store/size-guide
• FAQs: www.oment.store/faq

Follow Us:
• Instagram: @oment.store
• Facebook: /omentfashion

Average response time: 2-4 hours
        `
      }
    ];

    await Policy.insertMany(policies);
    console.log(`✅ Oment Policies seeded: ${policies.length}`);

  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => process.exit(0));
}
