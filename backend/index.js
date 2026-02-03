require('dotenv').config();
const express = require('express');
const app = express();
const weatherRoutes = require('./routes/weather');
const cors = require('cors');
const redis = require('redis');
const redisClient = redis.createClient();

const path = require("path");

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

app.use(cors()); // Cho phép frontend gọi từ domain khác
app.use(express.json());

redisClient.connect().catch(console.error);
app.set('redisClient', redisClient);

app.use('/api/weather', weatherRoutes);

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
