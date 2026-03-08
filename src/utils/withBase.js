// src/utils/withBase.js
export function withBase(path) {
  // BASE_URL is "/" for root deployments and can be overridden for subpath deployments.
  const base = import.meta.env.BASE_URL;

  // Remove any leading "/" from the path you give it
  const clean = String(path).replace(/^\/+/, "");

  // Join them together, e.g. "/" + "images/foo.jpg"
  return base + clean;
}
