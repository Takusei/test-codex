const http = require('http');
const { renderMarpSlides } = require('./src/slideRenderer');

const PORT = process.env.PORT || 3000;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function handleRender(req, res, body) {
  try {
    const parsed = JSON.parse(body || '{}');
    const markdown = parsed.markdown;

    if (!markdown || typeof markdown !== 'string') {
      return sendJson(res, 400, { error: 'Request body must include a `markdown` string.' });
    }

    const html = renderMarpSlides(markdown);
    return sendJson(res, 200, { html });
  } catch (error) {
    const message = error instanceof SyntaxError
      ? 'Unable to parse request JSON.'
      : error.message;
    return sendJson(res, 400, { error: message });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/render') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2e6) {
        body = '';
        res.writeHead(413).end();
        req.connection.destroy();
      }
    });
    req.on('end', () => handleRender(req, res, body));
    return;
  }

  if (req.method === 'GET' && req.url === '/') {
    const message = {
      message: 'Send a POST request to /render with a `markdown` field to receive a Marp-styled deck.',
      example: '# Title\n\n- Point one\n- Point two',
    };
    return sendJson(res, 200, message);
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Marp rendering API listening on port ${PORT}`);
  });
}

module.exports = { server };
