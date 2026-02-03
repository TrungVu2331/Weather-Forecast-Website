const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/main.html")
  );
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});
