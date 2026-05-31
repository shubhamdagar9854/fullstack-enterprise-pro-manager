require('dotenv').config();
const express = require('express');
const userRoutes = require('./routes/users');

const app = express();

// JSON samjhe app
app.use(express.json());

// Factor 11 — Logs (stdout pe)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} → ${req.method} ${req.url}`);
  next();
});

// Routes connect karo
app.use('/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Factor 7 — Port Binding
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User Service chal raha hai port ${PORT} pe 🚀`);
});