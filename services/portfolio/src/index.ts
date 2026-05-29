import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client/portfolio';
import { initPublisher, publishTransaction } from './publisher';
import { logger } from '@portfolio/shared';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Initialize RabbitMQ publisher
initPublisher().catch(err => {
    logger.error({ err }, 'Failed to initialize RabbitMQ publisher');
    process.exit(1);
});

app.post('/transactions', async (req, res) => {
    try {
        const { userId, assetSymbol, amount, transactionType } = req.body;

        if (!userId || !assetSymbol || !amount || !transactionType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Save to DB
        const transaction = await prisma.transaction.create({
            data: {
                userId,
                assetSymbol,
                amount,
                transactionType
            }
        });

        // 2. Publish Event
        await publishTransaction({
            transactionId: transaction.id,
            userId: transaction.userId,
            assetSymbol: transaction.assetSymbol,
            amount: transaction.amount,
            transactionType: transaction.transactionType as 'BUY' | 'SELL',
            timestamp: transaction.createdAt
        });

        res.status(201).json({ message: 'Transaction created successfully', transaction });
    } catch (error) {
        logger.error({ error }, '[Portfolio] Error creating transaction');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    logger.info(`Portfolio service listening on port ${PORT}`);
});
