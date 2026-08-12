const Rating = require('./models/Rating');

const sampleRatings = [
  {
    cakeId: '650000000000000000000001',
    userId: 'user123',
    userName: 'Pavushetti Ajay Chandra',
    rating: 5,
    comment: 'The Royal Chocolate Truffle Cake was absolutely rich, moist, and delicious!'
  },
  {
    cakeId: '650000000000000000000002',
    userId: 'user456',
    userName: 'Ananya Sharma',
    rating: 5,
    comment: 'Beautiful Red Velvet cake! Perfect cream cheese frosting and texture.'
  },
  {
    cakeId: '650000000000000000000003',
    userId: 'user789',
    userName: 'Vikram Patel',
    rating: 4,
    comment: 'Fresh fruit cake with light whipped cream. Great presentation!'
  }
];

async function seedRatings() {
  try {
    const count = await Rating.countDocuments();
    if (count === 0) {
      await Rating.insertMany(sampleRatings);
      console.log('✅ Initial sample ratings seeded successfully into MongoDB.');
    }
  } catch (error) {
    console.error('❌ Error seeding rating database:', error);
  }
}

module.exports = seedRatings;
