import { connectRabbitMQ, PORTFOLIO_EXCHANGE, TRANSACTION_ROUTING_KEY, PortfolioTransactionEvent, logger, PORTFOLIO_DLX, PORTFOLIO_DLQ } from '@portfolio/shared';
import { PrismaClient } from './generated/client';
import { createClient } from 'redis';
import amqp from 'amqplib';

const prisma = new PrismaClient();
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

redisClient.on('error', (err) => logger.error({ err }, 'Redis Client Error'));

export async function initConsumer() {
  await redisClient.connect();

  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const conn = await connectRabbitMQ(rabbitmqUrl);
  const channel = conn.channel;

  await channel.assertExchange(PORTFOLIO_EXCHANGE, 'topic', { durable: true });


  await channel.assertExchange(PORTFOLIO_DLX, 'topic', { durable: true });
  const dlq = await channel.assertQueue(PORTFOLIO_DLQ, { durable: true });
  await channel.bindQueue(dlq.queue, PORTFOLIO_DLX, '#');

  const q = await channel.assertQueue('notification_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': PORTFOLIO_DLX,
      'x-dead-letter-routing-key': 'dead.notification'
    }
  });
  await channel.bindQueue(q.queue, PORTFOLIO_EXCHANGE, TRANSACTION_ROUTING_KEY);

  logger.info('[Notification] Waiting for messages in notification_queue');

  channel.consume(q.queue, async (msg) => {
    if (msg !== null) {
      try {
        const event: PortfolioTransactionEvent = JSON.parse(msg.content.toString());
        await processNotification(event);
        channel.ack(msg);
      } catch (err) {
        logger.error({ err, msgContent: msg.content.toString() }, '[Notification] Error processing message, routing to DLQ');
        channel.nack(msg, false, false);
      }
    }
  });
}

async function processNotification(event: PortfolioTransactionEvent) {
  const cacheKey = `user_pref_${event.userId}`;

  let prefStr = await redisClient.get(cacheKey);
  let prefs;

  if (prefStr) {
    prefs = JSON.parse(prefStr);
  } else {

    prefs = await prisma.userPreference.findUnique({
      where: { userId: event.userId }
    });

    if (prefs) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(prefs)); // Cache for 1 hour
    }
  }

  if (!prefs) {
    logger.info(`[Notification] No preferences found for user ${event.userId}. Skipping.`);
    return;
  }


  if (event.amount < prefs.minAmount) {
    logger.info(`[Notification] Transaction amount ${event.amount} is below minimum ${prefs.minAmount} for user ${event.userId}. Skipping.`);
    return;
  }

  if (event.transactionType === 'BUY' && !prefs.notifyOnBuy) {
    logger.info(`[Notification] User ${event.userId} has disabled BUY notifications. Skipping.`);
    return;
  }

  if (event.transactionType === 'SELL' && !prefs.notifyOnSell) {
    logger.info(`[Notification] User ${event.userId} has disabled SELL notifications. Skipping.`);
    return;
  }

  logger.info(`[Notification] 📧 Sending email to ${prefs.email}: User ${event.userId} just made a ${event.transactionType} transaction of amount ${event.amount} for ${event.assetSymbol}.`);
}
