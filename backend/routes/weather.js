const axios = require('axios');
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

/* ================= LOG ================= */
const logDir = path.join(__dirname, '..', 'logs');
const logFilePath = path.join(logDir, 'queries.log');

// đảm bảo thư mục logs tồn tại
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

function logQuery(type, data, fromCache) {
    const timestamp = new Date().toISOString();
    const status = fromCache ? 'Cache HIT' : 'Cache MISS';
    let logLine = `[${timestamp}] ${type.toUpperCase()} - ${status}`;

    if (type === 'geocode') {
        logLine += ` - ${data.city} (${data.lat}, ${data.lon})\n`;
    } else if (type === 'forecast') {
        logLine += ` - (${data.lat}, ${data.lon})\n`;
    }

    fs.appendFile(logFilePath, logLine, err => {
        if (err) console.error('❌ Lỗi ghi log:', err);
    });
}

/* ================= FORECAST ================= */
router.get('/forecast', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Thiếu tọa độ' });
    }

    const latRounded = +parseFloat(lat).toFixed(3);
    const lonRounded = +parseFloat(lon).toFixed(3);
    const key = `weather:${latRounded},${lonRounded}`;
    const redisClient = req.app.get('redisClient');

    try {
        const cached = await redisClient.get(key);
        const logData = { lat: latRounded, lon: lonRounded };

        if (cached) {
            console.log('→ Redis Cache HIT:', key);
            logQuery('forecast', logData, true);
            return res.json(JSON.parse(cached));
        }

        const response = await axios.get(
            'https://api.weatherapi.com/v1/forecast.json',
            {
                params: {
                    key: process.env.WEATHER_API_KEY,
                    q: `${lat},${lon}`,
                    days: 6,
                    aqi: 'yes',
                    alerts: 'no'
                }
            }
        );

        const data = response.data;
        const { location, current } = data;

        // ✅ INSERT DB
        const sql = `
            INSERT INTO weather (city, temperature, humidity, description)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                location.name,
                current.temp_c,
                current.humidity,
                current.condition.text
            ],
            err => {
                if (err) {
                    console.error('❌ Insert error:', err);
                } else {
                    console.log('✅ Weather saved to RDS');
                }
            }
        );

        // Cache Redis
        await redisClient.setEx(key, 600, JSON.stringify(data));
        console.log('→ Redis Cache MISS:', key);
        logQuery('forecast', logData, false);

        res.json(data);

    } catch (err) {
        console.error('❌ Forecast error:', err);
        res.status(500).json({ error: 'Không thể lấy dữ liệu thời tiết' });
    }
});

/* ================= GEOCODE ================= */
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
            logQuery('geocode', data, true);
            return res.json(data);
        }

        const result = await axios.get(
            'https://api.weatherapi.com/v1/search.json',
            {
                params: {
                    key: process.env.WEATHER_API_KEY,
                    q: city
                }
            }
        );

        if (result.data.length > 0) {
            const { lat, lon, name } = result.data[0];
            const data = { city: name, lat, lon };

            await redisClient.setEx(key, 600, JSON.stringify(data));
            console.log('→ Redis Cache MISS:', key);
            logQuery('geocode', data, false);

            return res.json(data);
        }

        res.status(404).json({ error: 'Không tìm thấy thành phố' });

    } catch (err) {
        console.error('❌ Geocode error:', err);
        res.status(500).json({ error: 'Lỗi truy vấn API thời tiết' });
    }
});

module.exports = router;
