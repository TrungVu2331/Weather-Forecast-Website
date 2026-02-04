const axios = require('axios');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require ('../db'); 
//forecast
router.get('/forecast', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Thiếu tọa độ' });

    const latRounded = +parseFloat(lat).toFixed(3);
    const lonRounded = +parseFloat(lon).toFixed(3);
    const key = `weather:${latRounded},${lonRounded}`;
    const redisClient = req.app.get('redisClient');

    try {
        const cached = await redisClient.get(key);
        const dataObj = {lat: latRounded, lon: lonRounded}
        if (cached) {
            console.log('→ Redis Cache HIT:', key);
            logQuery('forecast', dataObj, true);
            return res.json(JSON.parse(cached));
        }

        const response = await axios.get('https://api.weatherapi.com/v1/forecast.json', {
            params: {
                key: process.env.WEATHER_API_KEY,
                q: `${lat},${lon}`,
                days: 6,
                aqi: 'yes',
                alerts: 'no'
            }
        });

        const data = response.data;
        await redisClient.setEx(key, 600, JSON.stringify(data)); // TTL 600s = 10 phút
        console.log('→ Redis Cache MISS:', key);
        logQuery('forecast', dataObj, false);
        res.json(data);
    } catch (err) {
        console.error('Lỗi lấy dự báo thời tiết:', err);
        res.status(500).json({ error: 'Không thể lấy dữ liệu thời tiết' });
    }
});

//Add log
const logFilePath = path.join(__dirname, '..', 'logs', 'queries.log');
function logQuery(type, data, fromCache)
{
    const timestamp = new Date().toISOString();
    const status = fromCache ? 'Cache HIT' : 'Cache MISS';
    let logLine = `[${timestamp}] ${type.toUpperCase()} - ${status}`;
    if(type === 'geocode'){
        logLine += ` - ${data.city} (${data.lat}, ${data.lon})\n`;
    }
    else if(type === 'forecast'){
        logLine += ` - (${data.lat}, ${data.lon})\n`;
    }
    
    fs.appendFile(logFilePath, logLine, err =>{
        if(err) console.err('Lỗi ghi log',err);
    });
}
//geocode
router.get('/geocode', async (req, res) => {
    const { city } = req.query;
    if (!city) return res.status(400).json({ error: 'Thiếu tên thành phố' });

    const redisClient = req.app.get('redisClient');
    const key = `geocode:${city.toLowerCase()}`;

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            const data = JSON.parse(cached);
            console.log('→ Redis Cache HIT:', key);
            logQuery('geocode',data,true);
            return res.json(data);
        }

        const result = await axios.get('https://api.weatherapi.com/v1/search.json', {
            params: {
                key: process.env.WEATHER_API_KEY,
                q: city
            }
        });

        if (result.data.length > 0) {
            const { lat, lon, name } = result.data[0];
            const data = { city: name, lat, lon };
            await redisClient.setEx(key, 600    , JSON.stringify(data)); // cache 1 ngày
            console.log('→ Redis Cache MISS:', key);
            logQuery('geocode',data,false);
            return res.json(data);
        }

        res.status(404).json({ error: 'Không tìm thấy thành phố' });
    } catch (err) {
        console.error('Lỗi geocode:', err);
        res.status(500).json({ error: 'Lỗi truy vấn API thời tiết' });
    }
});

router.post("/save", (req, res) => {
  const { city, temperature, humidity, description } = req.body;

  const sql = `
    INSERT INTO weather (city, temperature, humidity, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [city, temperature, humidity, description], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Saved to RDS" });
  });
});

module.exports = router;