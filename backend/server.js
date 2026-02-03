const express = require('express');
const path = require('path');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API
app.use('/weather', weatherRoutes);

// Health check cho ALB
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
