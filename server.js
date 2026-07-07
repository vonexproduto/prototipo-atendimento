const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const BASE = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.jsx':  'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function serveFile(filePath, res, urlPath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/CCM Atendimentos.html';
  const filePath = path.join(BASE, urlPath);

  // Rotas "limpas" sem extensão (ex.: /CCM-3009): se o path não tem
  // extensão e não existe como arquivo/diretório, tenta servir o .html
  // correspondente. Permite páginas internas acessíveis só pela URL.
  if (!path.extname(filePath)) {
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      serveFile(htmlPath, res, urlPath);
      return;
    }
  }

  serveFile(filePath, res, urlPath);
}).listen(PORT, '127.0.0.1', () => {
  console.log('Server running at http://localhost:' + PORT);
});
