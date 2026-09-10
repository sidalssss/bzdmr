require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Associations ---
Product.belongsTo(Category);
Category.hasMany(Product);

Order.belongsTo(User, { constraints: false }); // Optional for Guest Checkout
User.hasMany(Order);

OrderItem.belongsTo(Order);
Order.hasMany(OrderItem);

OrderItem.belongsTo(Product);
Product.hasMany(OrderItem);

Review.belongsTo(User);
User.hasMany(Review);

Review.belongsTo(Product);
Product.hasMany(Review);

const { Op } = require('sequelize');

app.use(cors());
app.use(express.json());

// --- Authentication Routes ---
// ... (Register and Login routes already exist) ...

// --- Product & Filter Routes ---

app.get('/api/products', async (req, res) => {
  try {
    const { category, brand, min_price, max_price, search } = req.query;
    
    let where = {};
    if (category) {
      const cat = await Category.findOne({ where: { name: category } });
      if (cat) where.CategoryId = cat.id;
    }
    if (brand) where.brand = brand;
    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = min_price;
      if (max_price) where.price[Op.lte] = max_price;
    }
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const products = await Product.findAll({ 
      where,
      include: [Category, { model: Review, attributes: ['rating', 'comment'] }] 
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Order & Payment Processing (Advanced) ---

app.post('/api/orders/checkout', async (req, res) => {
  const transaction = await sequelize.transaction(); // Start ATOMIC Transaction
  try {
    const { items, userId, isGuest, guestEmail, guestName, shippingAddress } = req.body;

    // 1. Validate Cart & Lock Prices (Fiyat Kilitleme)
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      // Fetch fresh product data (prevent stale price/stock)
      const product = await Product.findByPk(item.id, { transaction, lock: true }); 

      if (!product) {
        throw new Error(`Ürün bulunamadı: ID ${item.id}`);
      }

      // 2. Check Stock (Stok Kontrolü)
      if (product.stock_count < item.quantity) {
        throw new Error(`"${product.name}" için yeterli stok yok! (Kalan: ${product.stock_count})`);
      }

      // 3. Price Consistency Check (Fiyat Tutarlılığı)
      // Convert both to numbers to avoid type mismatch issues
      if (Number(product.price) !== Number(item.price)) {
        throw new Error(`"${product.name}" fiyatı değişti! Lütfen sepetinizi güncelleyin. (Eski: ${item.price}, Yeni: ${product.price})`);
      }

      calculatedTotal += Number(product.price) * item.quantity;
      validatedItems.push({ product, quantity: item.quantity, price: product.price, variation: item.selectedVariation });
    }

    // 4. Create Order (Pending Payment)
    const order = await Order.create({
      UserId: userId || null,
      is_guest: isGuest,
      guest_email: guestEmail,
      guest_name: guestName,
      shipping_address: shippingAddress,
      total_amount: calculatedTotal,
      payment_status: 'pending', // Payment not yet confirmed
      order_status: 'created'
    }, { transaction });

    // 5. Create Order Items & Reserve Stock (Optimistic Locking)
    for (const item of validatedItems) {
      await OrderItem.create({
        OrderId: order.id,
        ProductId: item.product.id,
        quantity: item.quantity,
        unit_price: item.price,
        selected_variation: item.variation
      }, { transaction });

      // Reserve Stock Immediately (Concurrency Control)
      await item.product.decrement('stock_count', { by: item.quantity, transaction });
    }

    await transaction.commit();

    // 6. Simulate Payment Gateway (Mock Response)
    // In real world: Return Iyzico/PayTR checkout form HTML or token
    res.status(201).json({
      success: true,
      orderId: order.id,
      totalAmount: calculatedTotal,
      paymentUrl: `/api/payment/mock-3d-secure?orderId=${order.id}` // Mock redirect
    });

  } catch (error) {
    await transaction.rollback(); // Rollback EVERYTHING on error
    console.error("Checkout Error:", error.message);
    res.status(400).json({ error: error.message, type: 'VALIDATION_ERROR' });
  }
});

// Mock 3D Secure Verification
app.post('/api/payment/verify', async (req, res) => {
  const { orderId, paymentResult } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) throw new Error('Sipariş bulunamadı!');

    if (paymentResult === 'success') {
      // Payment Successful
      order.payment_status = 'paid';
      order.order_status = 'processing';
      await order.save({ transaction });
      
      // Async Tasks (Email, SMS, Cargo Integration) - Non-blocking
      // In production: Add to message queue (RabbitMQ/Redis)
      console.log(`[ASYNC] Sending confirmation email to ${order.guest_email || 'User'}...`);
      console.log(`[ASYNC] Notifying Warehouse for Order #${order.id}...`);

      await transaction.commit();
      res.json({ success: true, message: 'Ödeme onaylandı, siparişiniz hazırlanıyor.' });
    } else {
      // Payment Failed - Release Stock
      order.payment_status = 'failed';
      order.order_status = 'cancelled';
      await order.save({ transaction });

      // Return items to stock
      const items = await OrderItem.findAll({ where: { OrderId: order.id }, transaction });
      for (const item of items) {
         const product = await Product.findByPk(item.ProductId, { transaction });
         await product.increment('stock_count', { by: item.quantity, transaction });
      }

      await transaction.commit();
      res.json({ success: false, message: 'Ödeme başarısız. Stoklar iade edildi.' });
    }
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Ödeme doğrulama hatası!' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync DB and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected!');
    await sequelize.sync({ force: false }); 
    
    // Seed default data if empty
    const count = await Product.count();
    if (count === 0) {
      const [cat1] = await Category.findOrCreate({ where: { name: 'IP Kameralar' } });
      const [cat2] = await Category.findOrCreate({ where: { name: 'Solar Sistemler' } });
      const [cat3] = await Category.findOrCreate({ where: { name: 'Aksesuar' } });

      await Product.bulkCreate([
        {
          name: "FRİSBY FC-2715B 300W MINI TOWER SİYAH KASA",
          brand: "Frisby",
          price: 4500,
          CategoryId: cat3.id,
          image_url: "/products/frisby-2715b.jpeg",
          stock_count: 10,
          rating: 4.5,
          reviews_count: 12,
          specs: ["300W Güç Kaynağı", "Mini Tower"]
        },
        {
          name: "O-KAM 9MP LENS 3 KAMERA ULTRA HD 4G SOLAR AKILLI GÜVENLİK KAMERASI",
          brand: "O-Kam",
          price: 6500,
          CategoryId: cat2.id,
          image_url: "/products/okam-solar.jpeg",
          stock_count: 5,
          rating: 4.9,
          reviews_count: 28,
          specs: ["9MP Ultra HD", "4G Sim Kart"]
        },
        {
          name: "O-KAM PLUSWR 4 LENS 4 KAMERALI WİFİ GÜVENLİK KAMERASI",
          brand: "O-Kam",
          price: 6000,
          CategoryId: cat1.id,
          image_url: "/products/okam-pluswr.jpeg",
          stock_count: 15,
          rating: 4.7,
          reviews_count: 45,
          specs: ["4 Lens", "WiFi Bağlantısı"]
        },
        {
          name: "DAHUA 3+3 MP 2.8MM 50MT WİFİ IP DOME GÜVENLİK KAMERASI",
          brand: "Dahua",
          price: 6000,
          CategoryId: cat1.id,
          image_url: "/products/dahua-dome.jpeg",
          stock_count: 8,
          rating: 4.6,
          reviews_count: 32,
          specs: ["3+3 Çift Lens", "50m Gece Görüş"]
        },
        {
          name: "XIAOMİ CAMERA CW100 DUAL - AKILLI ÇİFT LENSLİ GÜVENLİK KAMERASI",
          brand: "Xiaomi",
          price: 5500,
          CategoryId: cat1.id,
          image_url: "/products/xiaomi-cw100.jpeg",
          stock_count: 30,
          rating: 4.8,
          reviews_count: 88,
          specs: ["Çift Lens", "AI Takip"]
        }
      ]);
      console.log('Default products seeded!');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

startServer();
