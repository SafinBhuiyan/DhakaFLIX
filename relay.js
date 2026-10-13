const http = require('http');
const https = require('https');

const PORT = 8080;

// Prevent server crashes from any unhandled errors
process.on('uncaughtException', (err) => {
  console.error('[Relay Warning - Handled]:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Relay Warning - Handled]:', reason);
});

function streamVideo(targetUrl, req, res) {
  try {
    if (!targetUrl || typeof targetUrl !== 'string') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing or invalid url parameter');
      return;
    }

    // Security & Anti-Loop: Never proxy self or Cloudflare tunnels!
    if (targetUrl.includes('trycloudflare.com') || targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Error: Recursive proxy loop detected and blocked.');
      return;
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(targetUrl);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Error: Invalid URL format');
      return;
    }

    // Support both http and https protocols safely
    const client = parsedTarget.protocol === 'https:' ? https : http;

    // Forward video seek requests (Range header for scrubbing)
    const forwardHeaders = {};
    if (req.headers.range) {
      forwardHeaders.range = req.headers.range;
    }

    const upstreamReq = client.request(
      parsedTarget,
      {
        method: req.method,
        headers: forwardHeaders,
        timeout: 10000, // 10s connection timeout
      },
      (upstreamRes) => {
        // Sniff real video format
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
      console.error('[Timeout] BDIX server took too long to respond:', targetUrl);
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'text/plain' });
        res.end('Error: Connection to BDIX server timed out');
      }
    });

    upstreamReq.on('error', (err) => {
      console.error('[BDIX Connection Error]:', err.message);
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
    console.error('[Stream Catch]:', err.message);
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
    res.end(JSON.stringify({ status: 'online', message: 'DhakaFLIX Helper is running!' }));
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
  console.log('🍿 DhakaFLIX Relay Helper is LIVE and Crash-Proof!');
  console.log('📡 Port: ' + PORT);
});
