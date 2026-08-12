const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ratingRoutes = require('./routes/ratingRoutes');

const app = express();
const getPort = (val, fallback) => (val && !isNaN(val) ? Number(val) : fallback);
const PORT = getPort(process.env.PORT, 4003);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cake_delight';

app.set('json spaces', 2);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ratings', ratingRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Rating Microservice',
    status: 'UP',
    port: PORT,
    description: 'Manages cake product reviews, star ratings, and average rating aggregations',
    endpoints: {
      submitRating: '/api/ratings',
      allRatings: '/api/ratings',
      cakeRatings: '/api/ratings/cake/:cakeId',
      cakeSummary: '/api/ratings/cake/:cakeId/summary',
      allSummaries: '/api/ratings/summaries',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Rating Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Start Express HTTP server FIRST
app.listen(PORT, () => {
  console.log(`Rating Service running on port ${PORT}`);
});

const seedRatings = require('./seedData');

// Database connection retry loop
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Rating Service connected to MongoDB database');
    await seedRatings();
  } catch (err) {
    console.error('Rating Service MongoDB connection error:', err.message, '- Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

connectDB();
