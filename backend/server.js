require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('redis');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = 3000;

// Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(err => console.error('❌ Redis error', err));

app.set('redisClient', redisClient);

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API
app.use('/weather', weatherRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/main.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
