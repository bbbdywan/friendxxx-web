const WebSocket = require('ws');

const PORT = process.env.PORT || 3001;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'change-me-please';

let pcSocket = null;
let phoneSocket = null;

const wss = new WebSocket.Server({ port: PORT });

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  let role = null;
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Auth
      if (msg.type === 'auth') {
        if (msg.role === 'pc' && msg.token === AUTH_TOKEN) {
          role = 'pc';
          pcSocket = ws;
          console.log('[PC] connected');
          ws.send(JSON.stringify({ type: 'auth_ok', role: 'pc' }));
        } else if (msg.role === 'phone') {
          role = 'phone';
          phoneSocket = ws;
          console.log('[Phone] connected');
          ws.send(JSON.stringify({ type: 'auth_ok', role: 'phone' }));
        } else {
          ws.send(JSON.stringify({ type: 'error', text: 'Auth failed' }));
        }
        return;
      }

      // Ping/pong keepalive
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      // Relay phone -> PC
      if (role === 'phone') {
        if (pcSocket && pcSocket.readyState === WebSocket.OPEN) {
          pcSocket.send(JSON.stringify(msg));
        } else {
          ws.send(JSON.stringify({ type: 'error', text: 'PC not connected' }));
        }
      }

      // Relay PC -> phone
      if (role === 'pc') {
        if (phoneSocket && phoneSocket.readyState === WebSocket.OPEN) {
          phoneSocket.send(JSON.stringify(msg));
        }
      }
    } catch (e) {
      console.error('[Parse]', e.message);
    }
  });

  ws.on('close', () => {
    if (role === 'pc') {
      pcSocket = null;
      console.log('[PC] disconnected');
    }
    if (role === 'phone') {
      phoneSocket = null;
      console.log('[Phone] disconnected');
    }
  });
});

// Heartbeat: ping all clients every 30s
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(interval));

console.log(`Chat bridge server running on port ${PORT}`);
console.log(`Auth token: ${AUTH_TOKEN === 'change-me-please' ? 'WARNING: using default token!' : '***'}`);
