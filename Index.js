bSocket = require('ws');
const net = require('net');
const http = require('http');

// ============== CONFIG ==============
const POOL_HOST = 'pool.supportxmr.com';   // reliable Monero pool
const POOL_PORT = 3333;                    // standard Stratum port
const LISTEN_PORT = process.env.PORT || 3000;
// ====================================

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('BodyMine proxy is alive');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('[PROXY] Browser miner connected');

  const poolSocket = net.createConnection(POOL_PORT, POOL_HOST);

  poolSocket.on('connect', () => {
    console.log('[PROXY] Connected to real Monero pool');
  });

  // Browser → Pool
  ws.on('message', (data) => {
    if (poolSocket.writable) poolSocket.write(data);
  });

  // Pool → Browser
  poolSocket.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });

  ws.on('close', () => {
    console.log('[PROXY] Browser disconnected');
    poolSocket.destroy();
  });

  poolSocket.on('close', () => ws.close());
  poolSocket.on('error', () => ws.close());
  ws.on('error', () => poolSocket.destroy());
});

server.listen(LISTEN_PORT, () => {
  console.log(`✅ Private proxy running on port ${LISTEN_PORT}`);
  console.log(`   Use this URL in BodyMine: wss://YOUR-APP.onrender.com`);
});