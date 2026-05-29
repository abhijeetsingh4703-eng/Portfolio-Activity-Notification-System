import amqp from 'amqplib';

export async function connectRabbitMQ(url: string, retries = 5) {
  while (retries) {
    try {
      console.log(`Connecting to RabbitMQ at ${url}...`);
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();
      console.log('Connected to RabbitMQ successfully.');
      return { connection, channel };
    } catch (err) {
      console.error(`RabbitMQ connection failed. Retries left: ${retries - 1}`, err);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('Could not connect to RabbitMQ after retries');
}
