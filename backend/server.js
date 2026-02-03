const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// trỏ tới thư mục frontend
const FRONTEND_PATH = path.join(__dirname, '../frontend');

// serve frontend
app.use(express.static(FRONTEND_PATH));

// health check (ALB dùng cái này)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'main.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
