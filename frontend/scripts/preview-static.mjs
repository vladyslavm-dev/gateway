import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const port = Number(process.env.PORT || "3200");
const host = "127.0.0.1";

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".png", "image/png"],
]);

async function resolveFilePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0] || "/");
  const relativePath = cleanPath.replace(/^\/+/, "");

  const directPath = path.join(rootDir, relativePath);
  const candidates = [
    directPath,
    path.join(directPath, "index.html"),
    `${directPath}.html`,
  ];

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
}

const server = http.createServer(async (request, response) => {
  const filePath = await resolveFilePath(request.url || "/");

  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(filePath);
  const body = await fs.readFile(filePath);

  response.writeHead(200, {
    "Content-Type":
      contentTypes.get(extension) || "application/octet-stream",
  });
  response.end(body);
});

server.listen(port, host, () => {
  console.log(`Static preview listening on http://${host}:${port}`);
});
