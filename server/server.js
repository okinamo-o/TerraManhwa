import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import manhwaRoutes from './routes/manhwa.js';
import chapterRoutes from './routes/chapters.js';
import userRoutes from './routes/users.js';
import searchRoutes from './routes/search.js';
import commentRoutes from './routes/comments.js';
import scraperRoutes from './routes/scraper.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';
import collectionRoutes from './routes/collections.js';

import { startScheduler } from './scraper/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ═══ Global Error Shielding ═══ */
process.on('uncaughtException', (err) => {
  console.error('\n🔥 CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

/* ═══ Middleware ═══ */
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    'https://terramanhwa.com', 
    'https://terramanhwa.vercel.app', 
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

/* Rate limiting on auth */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts. Please try again later.' },
});

/* ═══ Routes ═══ */
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/manhwa', manhwaRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collections', collectionRoutes);

/* Health check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* 404 */
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/* Error handler */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ═══ DB Connection & Start ═══ */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      // Start cron scheduler for scraping
      try { startScheduler(); } catch (e) { console.log('⚠️ Scheduler not started (Redis may not be available)'); }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Start server anyway for development without DB
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (without DB)`);
    });
  });

export default app;
