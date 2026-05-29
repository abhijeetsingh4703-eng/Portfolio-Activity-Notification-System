import { connectRabbitMQ, PORTFOLIO_EXCHANGE, TRANSACTION_ROUTING_KEY, PortfolioTransactionEvent, logger } from '@portfolio/shared';
import amqp from 'amqplib';

let channel: amqp.Channel;

export async function initPublisher() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const conn = await connectRabbitMQ(rabbitmqUrl);
  channel = conn.channel;

  await channel.assertExchange(PORTFOLIO_EXCHANGE, 'topic', { durable: true });
}

export async function publishTransaction(event: PortfolioTransactionEvent) {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }

  const message = Buffer.from(JSON.stringify(event));
  channel.publish(PORTFOLIO_EXCHANGE, TRANSACTION_ROUTING_KEY, message, {
    persistent: true
  });
  logger.info(`[Portfolio] Published transaction ${event.transactionId}`);
}
