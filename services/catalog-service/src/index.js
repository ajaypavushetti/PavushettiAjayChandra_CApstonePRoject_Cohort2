const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const catalogRoutes = require('./routes/catalogRoutes');
const seedDatabase = require('./seedData');

const app = express();
const getPort = (val, fallback) => (val && !isNaN(val) ? Number(val) : fallback);
const PORT = getPort(process.env.PORT, 4001);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cake_delight';

app.set('json spaces', 2);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cakes', catalogRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Cake Catalog Microservice',
    status: 'UP',
    port: PORT,
    description: 'Manages cake product catalog, details, categories, and price filtering',
    endpoints: {
      listCakes: '/api/cakes',
      categories: '/api/cakes/categories',
      singleCake: '/api/cakes/:id',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Cake Catalog Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Start Express HTTP server FIRST
app.listen(PORT, () => {
  console.log(`Catalog Service running on port ${PORT}`);
});

// Database connection & automatic seeding
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Catalog Service connected to MongoDB database');
    await seedDatabase();
  } catch (err) {
    console.error('Catalog Service MongoDB connection error:', err.message, '- Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

connectDB();
