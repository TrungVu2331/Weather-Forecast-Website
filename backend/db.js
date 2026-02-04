const mysql = require('mysql2');

const db = mysql.createConnection({
  host: "database-1.ceanzdyu1zcu.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "weatherforecast",
  database: "weatherdb",
  port: 3306
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ MySQL connected');
  }
});

module.exports = db;
