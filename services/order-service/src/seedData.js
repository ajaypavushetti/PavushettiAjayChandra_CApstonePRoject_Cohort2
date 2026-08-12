const Order = require('./models/Order');

const sampleOrders = [
  {
    userId: 'user123',
    customerName: 'Pavushetti Ajay Chandra',
    email: 'ajay@example.com',
    phone: '9876543210',
    deliveryAddress: 'Plot 42, Jubilee Hills, Hyderabad',
    items: [
      {
        cakeId: '650000000000000000000001',
        name: 'Royal Chocolate Truffle Cake',
        price: 799,
        quantity: 1,
        category: 'Chocolate'
      }
    ],
    subtotal: 799,
    tax: 0,
    deliveryFee: 0,
    totalAmount: 799,
    status: 'COMPLETED',
    paymentMethod: 'CREDIT_CARD'
  },
  {
    userId: 'user456',
    customerName: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '9812345678',
    deliveryAddress: 'Flat 302, Green Glen Layout, Bengaluru',
    items: [
      {
        cakeId: '650000000000000000000002',
        name: 'Red Velvet Supreme Cake',
        price: 849,
        quantity: 1,
        category: 'Red Velvet'
      }
    ],
    subtotal: 849,
    tax: 0,
    deliveryFee: 0,
    totalAmount: 849,
    status: 'COMPLETED',
    paymentMethod: 'UPI'
  }
];

async function seedOrders() {
  try {
    const count = await Order.countDocuments();
    if (count === 0) {
      await Order.insertMany(sampleOrders);
      console.log('✅ Initial sample orders seeded successfully into MongoDB.');
    }
  } catch (error) {
    console.error('❌ Error seeding order database:', error);
  }
}

module.exports = seedOrders;
