require('dotenv').config();

const express = require('express');
const path = require('path');
const { createClient } = require('redis');
const weatherRoutes = require('./routes/weather');
const db = require('./db'); // 👈 test MySQL connection

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= Middleware ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= Redis ================= */
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(err => console.error('❌ Redis error:', err));

app.set('redisClient', redisClient);

/* ================= Frontend ================= */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ================= API ================= */
app.use('/weather', weatherRoutes);

/* ================= Health check ================= */
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/* ================= Default route ================= */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/main.html'));
});

/* ================= Start server ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
