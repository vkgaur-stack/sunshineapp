const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Shared/cPanel hosting (and most cloud hosts) put the app behind a
// reverse proxy (Passenger, nginx, etc.). Without this, express-rate-limit
// and req.ip both see the proxy's IP for every request instead of the
// real client — trusting the first proxy hop fixes both.
app.set('trust proxy', 1);

app.use(helmet());

// FRONTEND_ORIGIN accepts a comma-separated list so the public site, admin
// dashboard (same origin normally, but split out if ever hosted
// separately), and clinic portal can all be allowed explicitly rather than
// wildcarding CORS.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (server-to-server, curl, mobile apps).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Basic protection against form-spam/brute force on public endpoints.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', publicLimiter);

// Tighter limit specifically on login endpoints — brute-forcing a login
// is a much higher-value target than a generic form submission, so it
// gets its own stricter budget on top of the general one above.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});
app.use('/api/admin/login', authLimiter);
app.use('/api/clinic/login', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
