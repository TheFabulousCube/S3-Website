#!/usr/bin/env node
// Simple static server that behaves more like S3 website hosting
// Features:
// - Serves index document for directory requests (index.html)
// - Serves error document on 4xx/5xx (if provided)
// - Basic content-type mapping
// - Optional SPA mode to fallback to index.html

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const root = process.cwd();
const port = process.env.PORT || 4567;
const INDEX = "index.html";
const ERROR_DOC = process.env.ERROR_DOC || "error.html"; // if present
const SPA = process.env.SPA === "1"; // if set, fallback to index for not-found

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

function contentType(file) {
  return mime[path.extname(file).toLowerCase()] || "application/octet-stream";
}

function sendFile(res, filePath, status = 200) {
  fs.stat(filePath, (err, stat) => {
    if (err) {
      return sendError(res, 404);
    }
    const stream = fs.createReadStream(filePath);
    res.writeHead(status, {
      "Content-Type": contentType(filePath),
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
    });
    stream.pipe(res);
  });
}

function sendError(res, status = 404) {
  const errPath = path.join(root, ERROR_DOC);
  fs.stat(errPath, (e, s) => {
    if (!e && s.isFile()) {
      fs.readFile(errPath, (er, data) => {
        if (er) return plainError(res, status);
        res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
      });
    } else if (SPA && status === 404) {
      // SPA fallback to index
      const idx = path.join(root, INDEX);
      if (fs.existsSync(idx)) return sendFile(res, idx, 200);
      plainError(res, status);
    } else {
      plainError(res, status);
    }
  });
}

function plainError(res, status = 404) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(`${status} ${http.STATUS_CODES[status]}`);
}

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url);
    let safePath = path
      .normalize(decodeURIComponent(parsed.pathname))
      .replace(/^\.+/, "");
    let fullPath = path.join(root, safePath);

    // If path is directory or ends with /, try index
    if (fullPath.endsWith(path.sep) || req.url.endsWith("/")) {
      const idx = path.join(fullPath, INDEX);
      if (fs.existsSync(idx)) return sendFile(res, idx, 200);
      return sendError(res, 404);
    }

    // If file exists, serve
    fs.stat(fullPath, (err, stat) => {
      if (!err && stat.isFile()) return sendFile(res, fullPath, 200);

      // Try as directory with index
      const idx = path.join(fullPath, INDEX);
      if (fs.existsSync(idx)) return sendFile(res, idx, 200);

      // Not found
      sendError(res, 404);
    });
  } catch (ex) {
    console.error("Server error", ex);
    sendError(res, 500);
  }
});

server.listen(port, () => {
  console.log(
    `Serving ${root} on http://localhost:${port}/ (index=${INDEX}, error=${ERROR_DOC}, SPA=${SPA})`,
  );
});
