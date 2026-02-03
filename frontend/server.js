const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
    res.send('Weather Forecast Backend is running');
});
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(3000, () => console.log('🔵 Server đang chạy tại http://localhost:3000'));
