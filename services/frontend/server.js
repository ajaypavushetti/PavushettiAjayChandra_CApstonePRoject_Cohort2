const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const getPort = (val, fallback) => (val && !isNaN(val) ? Number(val) : fallback);
const PORT = getPort(process.env.PORT, 3000);
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:4000';

// Proxy /api requests on port 3000 to Express Gateway on port 4000
app.use(
  createProxyMiddleware({
    target: GATEWAY_URL,
    changeOrigin: true,
    pathFilter: '/api'
  })
);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Cake Delight Client Web App running at http://localhost:${PORT}`);
});
