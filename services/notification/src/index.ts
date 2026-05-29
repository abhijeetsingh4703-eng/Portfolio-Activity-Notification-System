import 'dotenv/config';
import express from 'express';
import { PrismaClient } from './generated/client';
import { initConsumer } from './consumer';
import { logger } from '@portfolio/shared';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

app.use(express.json());

initConsumer().catch(err => {
    logger.error({ err }, 'Failed to initialize Notification consumer');
    process.exit(1);
});

// Updated routes with API prefix
app.post('/preferences', async (req, res) => {
    try {
        const { userId, email, notifyOnBuy, notifyOnSell, minAmount } = req.body;

        if (!userId || !email) {
            return res.status(400).json({ error: 'Missing userId or email' });
        }

        const pref = await prisma.userPreference.upsert({
            where: { userId },
            update: { email, notifyOnBuy, notifyOnSell, minAmount },
            create: { userId, email, notifyOnBuy, notifyOnSell, minAmount }
        });

        res.status(200).json({ message: 'Preferences updated successfully', preference: pref });
    } catch (error) {
        logger.error({ error }, '[Notification] Error updating preferences');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/preferences/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const pref = await prisma.userPreference.findUnique({
            where: { userId }
        });

        if (!pref) {
            return res.status(404).json({ error: 'Preferences not found' });
        }

        res.status(200).json({ preference: pref });
    } catch (error) {
        logger.error({ error }, '[Notification] Error fetching preferences');
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => logger.info(`Notification service listening on port ${PORT}`));
