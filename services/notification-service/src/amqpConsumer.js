const amqp = require('amqplib');
const Notification = require('./models/Notification');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'cake_delight_events';
const QUEUE_NAME = 'notification_order_completed_queue';
const ROUTING_KEY = 'order.completed';

async function startAMQPConsumer() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);

    // Prevent unhandled ECONNRESET socket drops from crashing Node.js process
    connection.on('error', (err) => {
      console.log(`[RabbitMQ AMQP] Connection error caught gracefully (${err.message}). Will reconnect on retry.`);
    });

    connection.on('close', () => {
      console.log(`[RabbitMQ AMQP] Connection closed by broker. Reconnecting in 5 seconds...`);
      setTimeout(startAMQPConsumer, 5000);
    });

    const channel = await connection.createChannel();
    channel.on('error', (err) => {
      console.log(`[RabbitMQ AMQP] Channel error caught gracefully (${err.message}).`);
    });

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log(`[RabbitMQ AMQP] Consumer active! Listening on Queue: '${QUEUE_NAME}' for Exchange: '${EXCHANGE_NAME}'`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ AMQP Consumer] Received Event: ${event.eventType}`);

          if (event.eventType === 'ORDER_COMPLETED' && event.data) {
            const orderId = event.data._id ? event.data._id.toString() : (event.data.orderId || `ord_${Date.now()}`);
            const { userId, customerName, subtotal, tax, deliveryFee, totalAmount, items } = event.data;

            // Deduplication check: ignore if notification for this order already exists
            const existingNotif = await Notification.findOne({ orderId: orderId || `ord_${Date.now()}` });
            if (existingNotif) {
              console.log(`[RabbitMQ AMQP Consumer] Notification for Order #${orderId} already processed. Skipping duplicate.`);
              channel.ack(msg);
              return;
            }

            const itemSummary = items && items.length > 0 ? items.map((i) => `${i.quantity}x ${i.name}`).join(', ') : 'Cake Delights';
            const feeInfo = subtotal ? ` (Subtotal: ₹${subtotal.toFixed(2)} + Tax: ₹${(tax || 0).toFixed(2)} + Delivery: ₹${(deliveryFee || 0).toFixed(2)})` : '';

            const notification = new Notification({
              userId: userId || 'user123',
              orderId: orderId || `ord_${Date.now()}`,
              title: 'Cake Order Confirmed!',
              message: `Hi ${customerName || 'Valued Customer'}, your order for [${itemSummary}] totaling ₹${totalAmount.toFixed(2)}${feeInfo} has been confirmed and is being freshly prepared!`,
              channel: 'IN_APP',
              deliveryStatus: 'DELIVERED',
              isRead: false,
              eventData: event.data
            });

            await notification.save();
            console.log(`[RabbitMQ AMQP Consumer] Saved notification to MongoDB for Order #${orderId}`);
          }

          channel.ack(msg);
        } catch (err) {
          console.error('Error processing AMQP message:', err.message);
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (error) {
    console.log(`[RabbitMQ AMQP Consumer] AMQP broker connection unreached (${error.message}). Will retry in 10s...`);
    setTimeout(startAMQPConsumer, 10000);
  }
}

module.exports = { startAMQPConsumer };
