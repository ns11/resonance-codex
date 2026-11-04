// Serve the codex folder on 127.0.0.1:<port> for the checks.
// Usage: node checks/serve.js [codex folder] [port]     (default: the parent of checks/ and 8765, the port the checks expect)
// Since 2.3.0 the published index.html is the whole page, with the platform's skeleton, and is served as it is.
// An older index.html without a doctype is wrapped in a minimal skeleton, as the Artifact tool did at publish.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const PORT = Number(process.argv[3] || 8765);
const SKEL_HEAD = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>*{box-sizing:border-box}html,body{margin:0}</style></head><body>';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let url;
  try { url = decodeURIComponent((req.url || '/').split('?')[0]); } catch (e) { res.writeHead(400); res.end(); return; }
  if (url === '/' || url === '/index.html') {
    let page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    if (!/^\s*<!doctype/i.test(page)) page = SKEL_HEAD + page + '</body></html>';
    res.writeHead(200, { 'Content-Type': TYPES['.html'] });
    res.end(page);
    return;
  }
  const file = path.join(ROOT, path.normalize(url).replace(/^[/\\]+/, ''));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1');
