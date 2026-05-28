'use strict';
// ============================================================
// SERVER: events.js
// Server-Sent Events (SSE) broadcaster.
// Mentor dashboard connects via GET /api/events and receives
// an 'update' event whenever any student data changes.
// ============================================================

const _clients = new Set();

/**
 * Express route handler — call from routes.js for GET /api/events.
 * Keeps the connection open and registers the client for broadcasts.
 */
function sseHandler(req, res) {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Initial heartbeat so the browser sees a successful connection
  res.write(':ok\n\n');

  _clients.add(res);

  // Heartbeat every 25 s to prevent proxy / firewall timeouts
  const heartbeat = setInterval(() => {
    res.write(':heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    _clients.delete(res);
  });
}

/**
 * Broadcast an 'update' event to all connected SSE clients.
 * Called by routes.js after every successful write operation.
 * @param {string} [detail] - optional payload (ignored by current client code)
 */
function broadcast(detail) {
  const data = detail ? JSON.stringify(detail) : '{}';
  const msg  = `event: update\ndata: ${data}\n\n`;
  _clients.forEach(client => {
    try { client.write(msg); } catch (_) { _clients.delete(client); }
  });
}

module.exports = { sseHandler, broadcast };
