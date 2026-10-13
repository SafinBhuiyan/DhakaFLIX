const http = require('http');

const PORT = 8080;

// Single test movie (A Bug's Life - 1080p MP4 from Server 14)
const TEST_MOVIE = 'http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/A%20Bug%27s%20Life%20%281998%29%201080p/A.Bugs.Life.1998.1080p.BluRay.x264.YIFY.mp4';

function streamVideo(targetUrl, req, res) {
  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid URL');
    return;
  }

  const forwardHeaders = {};
  if (req.headers.range) {
    forwardHeaders.range = req.headers.range;
  }

  const upstreamReq = http.request(
    parsedTarget,
    { method: req.method, headers: forwardHeaders },
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

  upstreamReq.on('error', (err) => {
    console.error('[Error]:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Error reaching storage server: ' + err.message);
    }
  });

  req.on('close', () => {
    upstreamReq.destroy();
  });

  upstreamReq.end();
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

  // 1-Click Short Movie: /play or /play.mp4
  if (reqUrl.pathname === '/play' || reqUrl.pathname === '/play.mp4') {
    streamVideo(TEST_MOVIE, req, res);
    return;
  }

  // Universal Stream endpoint: /stream?url=...
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
  console.log('🍿 DhakaFLIX Relay Helper is LIVE!');
  console.log('🎬 Short Test Movie: http://localhost:8080/play.mp4');
});
