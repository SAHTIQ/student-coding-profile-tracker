import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import exportRoutes from './routes/export.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CodePulse Institutional API', timestamp: new Date() });
});

import { CronService } from './services/cron.service';

app.listen(PORT, () => {
  console.log(`🚀 CodePulse Backend Server running on http://localhost:${PORT}`);
  CronService.init();
});

export default app;
