// Static server for the web export, with single-page fallback so deep links like /route load the app.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';

const root = process.argv[2] ?? 'dist-e2e';
const port = Number(process.env.PORT ?? 8765);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json', '.ico': 'image/x-icon' };

createServer((req, res) => {
  let file = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1');
