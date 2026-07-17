// Kasi Lifestyle — Express server.
// Serves the static game client from /public and exposes a health check for Render.
// No build step, no heavy dependencies: Node 18+ and Express only.

const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// Health check used by Render (see healthCheckPath in render.yaml).
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', game: 'Kasi Lifestyle' });
});

// Static game client. HTML is always fresh; assets get light caching.
app.use(
  express.static(path.join(__dirname, 'public'), {
    index: 'index.html',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

app.listen(PORT, () => {
  console.log(`Kasi Lifestyle running -> http://localhost:${PORT}`);
});
