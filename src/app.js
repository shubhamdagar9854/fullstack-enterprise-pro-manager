const express = require('express');
const config = require('./config');
const userRoutes = require('./routes/users');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/users', userRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`User Service is running on port ${config.port} 🚀`);
});