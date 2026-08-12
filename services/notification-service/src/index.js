const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const notificationRoutes = require('./routes/notificationRoutes');
const { startAMQPConsumer } = require('./amqpConsumer');

const app = express();
const getPort = (val, fallback) => (val && !isNaN(val) ? Number(val) : fallback);
const PORT = getPort(process.env.PORT, 4004);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/cake_delight';

app.set('json spaces', 2);
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notifications', notificationRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Notification Microservice',
    status: 'UP',
    port: PORT,
    description: 'Consumes order events via AMQP RabbitMQ, logs email/SMS delivery, and stores notifications',
    endpoints: {
      allNotifications: '/api/notifications',
      userNotifications: '/api/notifications/user/:userId',
      markRead: '/api/notifications/:id/read',
      markAllRead: '/api/notifications/user/:userId/read-all',
      eventWebhook: '/api/notifications/event',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Notification Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Start Express HTTP server FIRST
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  startAMQPConsumer();
});

// Database connection retry loop
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Notification Service connected to MongoDB database');
  } catch (err) {
    console.error('Notification Service MongoDB connection error:', err.message, '- Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

connectDB();
