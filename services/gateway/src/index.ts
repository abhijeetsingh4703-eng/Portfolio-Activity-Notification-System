import express from 'express';
import proxy from 'express-http-proxy';
import dotenv from 'dotenv';
import { logger } from '@portfolio/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const portfolioServiceUrl = process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:3001';
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification:3002';

// Basic logging middleware
app.use((req, res, next) => {
    logger.info(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Proxy routes
app.use('/api/portfolio', proxy(portfolioServiceUrl));
app.use('/api/notification', proxy(notificationServiceUrl));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Gateway is healthy' });
});

app.listen(PORT, () => {
    logger.info(`Gateway service listening on port ${PORT}`);
});
