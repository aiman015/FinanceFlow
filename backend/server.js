require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { generateDueRecurringTransactions } = require('./utils/generateRecurringTransactions');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

connectDB();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Basic rate limiting on auth endpoints to slow down brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FinanceFlow API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Poll for due recurring transactions every hour. For production, prefer a
// proper scheduler (node-cron, or a platform cron hitting a protected route)
// over setInterval, since setInterval resets on every deploy/restart.
const HOUR = 60 * 60 * 1000;
setInterval(() => {
  generateDueRecurringTransactions().catch((err) =>
    console.error('Recurring transaction job failed:', err.message)
  );
}, HOUR);
