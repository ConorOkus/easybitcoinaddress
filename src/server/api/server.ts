import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import config from './config/config';
import logger from './config/logger';
import recordRoutes from './routes/records';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://easybitcoinaddress-app-production.up.railway.app',
      'https://easybitcoinaddress.me',
      'https://*.up.railway.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/', recordRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`BIP353 API server started on 0.0.0.0:${config.port}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
