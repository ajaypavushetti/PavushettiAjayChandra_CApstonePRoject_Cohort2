const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');

const app = express();
const getPort = (val, fallback) => (val && !isNaN(val) ? Number(val) : fallback);
const PORT = getPort(process.env.PORT, 4002);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cake_delight';

app.set('json spaces', 2);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Order Microservice',
    status: 'UP',
    port: PORT,
    description: 'Manages shopping basket (+/- quantity), checkout execution, order totals, and event publishing',
    endpoints: {
      getBasket: '/api/orders/basket/:userId',
      checkout: '/api/orders/checkout',
      userOrders: '/api/orders/user/:userId',
      allOrders: '/api/orders',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Order Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Start Express HTTP server FIRST
app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});

const seedOrders = require('./seedData');

// Database connection retry loop
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Order Service connected to MongoDB database');
    await seedOrders();
  } catch (err) {
    console.error('Order Service MongoDB connection error:', err.message, '- Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

connectDB();
