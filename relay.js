const http = require('http');
const https = require('https');

const PORT = 8080;

// High-performance persistent connection agent (eliminates TCP handshake delay on seeks)
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 30,
  timeout: 60000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 30,
  timeout: 60000,
});

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Relay Warning]:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Relay Warning]:', reason);
});

function streamVideo(targetUrl, req, res) {
  try {
    if (!targetUrl || typeof targetUrl !== 'string') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing or invalid url parameter');
      return;
    }

    if (targetUrl.includes('trycloudflare.com') || targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Error: Recursive loop detected and blocked.');
      return;
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Error: Invalid URL format');
      return;
    }

    const isHttps = parsedTarget.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    // Forward Range header for video scrubbing
    const forwardHeaders = {};
    if (req.headers.range) {
      forwardHeaders.range = req.headers.range;
    }

    // Disable Nagle's algorithm for instant chunk transmission
    if (req.socket) req.socket.setNoDelay(true);
    if (res.socket) res.socket.setNoDelay(true);

    const upstreamReq = client.request(
      parsedTarget,
      {
        method: req.method,
        headers: forwardHeaders,
        agent: agent,
        timeout: 10000,
      },
      (upstreamRes) => {
        let mimeType = upstreamRes.headers['content-type'];
        const lowerUrl = targetUrl.toLowerCase();
        if (!mimeType || mimeType === 'application/octet-stream') {
          if (lowerUrl.includes('.mkv')) mimeType = 'video/x-matroska';
          else if (lowerUrl.includes('.mp4')) mimeType = 'video/mp4';
          else if (lowerUrl.includes('.webm')) mimeType = 'video/webm';
          else if (lowerUrl.includes('.avi')) mimeType = 'video/x-msvideo';
          else mimeType = 'video/mp4';
        }

        const responseHeaders = {
          'Access-Control-Allow-Origin': '*',
          'Accept-Ranges': 'bytes',
          'Content-Type': mimeType,
          'Content-Disposition': 'inline',
          'Cache-Control': 'public, max-age=3600',
        };

        if (upstreamRes.headers['content-length']) {
          responseHeaders['content-length'] = upstreamRes.headers['content-length'];
        }
        if (upstreamRes.headers['content-range']) {
          responseHeaders['content-range'] = upstreamRes.headers['content-range'];
        }

        res.writeHead(upstreamRes.statusCode || 200, responseHeaders);
        upstreamRes.pipe(res);
      }
    );

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'text/plain' });
        res.end('Error: Connection to BDIX server timed out');
      }
    });

    upstreamReq.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Error reaching BDIX storage server: ' + err.message);
      }
    });

    req.on('close', () => {
      upstreamReq.destroy();
    });

    upstreamReq.end();
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error: ' + err.message);
    }
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health check
  if (reqUrl.pathname === '/' || reqUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', message: 'DhakaFLIX Relay is running!' }));
    return;
  }

  // Stream endpoint: /stream or /stream/video.mp4?url=...
  if (reqUrl.pathname.startsWith('/stream')) {
    const targetUrl = reqUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing url parameter');
      return;
    }
    streamVideo(targetUrl, req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 DhakaFLIX High-Speed Relay running on port ' + PORT);
});
