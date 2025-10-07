// src/utils/withBase.js
export function withBase(path) {
  // In dev: import.meta.env.BASE_URL = "/"
  // In prod build: import.meta.env.BASE_URL = "/open-day/"
  const base = import.meta.env.BASE_URL;

  // Remove any leading "/" from the path you give it
  const clean = String(path).replace(/^\/+/, "");

  // Join them together, e.g. "/open-day/" + "images/foo.jpg"
  return base + clean;
}