require('dotenv').config();
const { spawn } = require('child_process');
const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:3001';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'change-me-please';

let reconnectTimer = null;
let currentWs = null;

function connect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  console.log(`Connecting to ${WS_URL}...`);
  const ws = new WebSocket(WS_URL);
  currentWs = ws;

  ws.on('open', () => {
    console.log('Connected, authenticating...');
    ws.send(JSON.stringify({ type: 'auth', role: 'pc', token: AUTH_TOKEN }));
  });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    // Auth response
    if (msg.type === 'auth_ok') {
      console.log('Authenticated successfully');
      return;
    }

    if (msg.type === 'error') {
      console.error('Server error:', msg.text);
      return;
    }

    // Got a message from phone
    if (msg.type === 'message') {
      console.log(`\n📱 ${msg.text}`);
      process.stdout.write('🤖 ');

      const claude = spawn('claude', ['--dangerously-skip-permissions', '-p', msg.text], {
        env: { ...process.env, NO_COLOR: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        cwd: 'C:\\Users\\bb',
      });

      let hasOutput = false;

      claude.stdout.on('data', (chunk) => {
        hasOutput = true;
        const text = chunk.toString();
        process.stdout.write(text);
        safeSend(ws, { type: 'chunk', text });
      });

      claude.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        process.stderr.write(text);
        safeSend(ws, { type: 'chunk', text });
      });

      claude.on('close', (code) => {
        if (!hasOutput) {
          const errText = `claude exited with code ${code}`;
          safeSend(ws, { type: 'chunk', text: errText });
        }
        safeSend(ws, { type: 'done' });
        console.log('');
      });

      claude.on('error', (err) => {
        safeSend(ws, { type: 'chunk', text: `Error: ${err.message}` });
        safeSend(ws, { type: 'done' });
        console.error('Spawn error:', err.message);
      });
    }
  });

  ws.on('close', () => {
    console.log('Disconnected, reconnecting in 5s...');
    reconnectTimer = setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    ws.close();
  });
}

function safeSend(ws, msg) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  } catch {
    // Ignore send errors (connection may have dropped)
  }
}

// Keepalive - send app-level ping to keep the relay alive
setInterval(() => {
  if (currentWs && currentWs.readyState === WebSocket.OPEN) {
    currentWs.send(JSON.stringify({ type: 'ping' }));
  }
}, 25000);

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

connect();
