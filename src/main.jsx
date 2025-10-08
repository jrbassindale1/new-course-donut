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

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;

    const root = document.documentElement;
    let rafId = null;

    const setViewportHeight = () => {
      rafId = null;
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      root.style.setProperty("--vh", `${height}px`);
    };

    const queueUpdate = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(setViewportHeight);
    };

    setViewportHeight();

    window.addEventListener("resize", queueUpdate);
    window.addEventListener("orientationchange", queueUpdate);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", queueUpdate);
      window.visualViewport.addEventListener("scroll", queueUpdate);
    }

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", queueUpdate);
      window.removeEventListener("orientationchange", queueUpdate);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", queueUpdate);
        window.visualViewport.removeEventListener("scroll", queueUpdate);
      }
    };
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(container).render(<Root />);
