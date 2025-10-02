import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initAnalytics } from "./lib/analytics.js";

const container = document.getElementById("root");

export function Root() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(container).render(<Root />);
