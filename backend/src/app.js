const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ---- Security & core middleware -------------------------------------------------
app.use(helmet()); // sets secure HTTP headers, mitigates common vulns
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Global rate limiter - protects against brute force / abuse.
// Stricter limits are applied per-route (e.g. auth routes) elsewhere.
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ---- Health check -----------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CloudVault API is healthy', uptime: process.uptime() });
});

// ---- API routes ---------------------------------------------------------------
app.use('/api', require('./routes'));

// ---- 404 + error handling (must be last) --------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
