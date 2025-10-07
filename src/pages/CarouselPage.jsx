import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { setAnalyticsContext, trackEvent, trackTiming } from "../lib/analytics.js";

// Prefix relative asset paths with the correct base ("/" in dev, "/open-day/" in prod)
const withBase = (p) => {
  if (!p) return p;
  // leave external or data/blob URLs alone
  if (/^(https?:|data:|blob:)/i.test(p)) return p;
  const base = import.meta?.env?.BASE_URL || "/";
  return base + String(p).replace(/^\/+/, "");
};

const PLACEHOLDER_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    alt: "Sunlit architectural model casting soft shadows",
  },
  {
    src: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80",
    alt: "Studio desk covered with design sketches and tracing paper",
  },
  {
    src: "https://images.unsplash.com/photo-1529429617124-aeea3a17e450?auto=format&fit=crop&w=1200&q=80",
    alt: "Minimalist building facade with geometric windows",
  },
  {
    src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    alt: "Students collaborating over architecture plans",
  },
];

const AUTO_PLAY_INTERVAL = 5000;

export default function CarouselPage({ onNavigate }) {
  const images = useMemo(() => PLACEHOLDER_IMAGES, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideTimerRef = useRef({ index: null, startedAt: 0 });
  const changeMetaRef = useRef({ method: "initial" });

  const now = useCallback(() => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }, []);

  const flushSlideDuration = useCallback((reason) => {
    if (typeof window === "undefined") return;
    const { index: previousIndex, startedAt } = slideTimerRef.current;
    if (previousIndex == null || !startedAt) return;
    const elapsed = now() - startedAt;
    if (elapsed <= 0) return;
    const meta = changeMetaRef.current || {};
    trackTiming("carousel_slide_duration", elapsed, {
      slide_index: previousIndex,
      reason,
      method: meta.method,
    });
    slideTimerRef.current = { index: null, startedAt: 0 };
  }, [now]);

  useEffect(() => {
    const id = window.setInterval(() => {
      changeMetaRef.current = { method: "auto" };
      setActiveIndex((index) => (index + 1) % images.length);
    }, AUTO_PLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [images.length]);

  const goToSlide = useCallback((nextIndex, meta = { method: "programmatic" }) => {
    changeMetaRef.current = meta;
    setActiveIndex((current) => {
      const length = images.length;
      if (!length) return current;
      const next = ((nextIndex % length) + length) % length;
      trackEvent("carousel_interaction", {
        method: meta.method,
        from_index: current,
        to_index: next,
        total_slides: length,
      });
      return next;
    });
  }, [images.length]);

  const handleNavigateHome = (event) => {
    if (onNavigate) {
      event?.preventDefault?.();
      trackEvent("carousel_link_click", {
        target_view: "chart",
        control: "back_to_overview",
      });
      onNavigate("chart");
    }
  };

  useEffect(() => {
    const meta = changeMetaRef.current || {};
    const timestamp = now();
    const slide = images?.[activeIndex] || {};
    slideTimerRef.current = { index: activeIndex, startedAt: timestamp };
    setAnalyticsContext({ carousel_slide_index: activeIndex });
    trackEvent("carousel_slide_view", {
      slide_index: activeIndex,
      slide_alt: slide.alt,
      method: meta.method,
    });

    return () => {
      flushSlideDuration("slide_change");
    };
  }, [activeIndex, flushSlideDuration, images, now]);

  useEffect(() => () => {
    flushSlideDuration("carousel_unmount");
  }, [flushSlideDuration]);

  return (
    <div className="app-shell carousel-page">
      <header className="page-header carousel-header">
        <h1 className="page-title">Studio Image Carousel</h1>
        <a className="btn secondary" href="#/chart" onClick={handleNavigateHome}>
          Back to Programme Overview
        </a>
      </header>
      <main className="carousel-main" aria-live="polite">
        <div className="carousel-viewport">
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <figure
                key={image.src}
                className={`carousel-slide${isActive ? " is-active" : ""}`}
                aria-hidden={!isActive}
              >
                <img src={withBase(image.src)} alt={image.alt} className="carousel-image" />
                <figcaption className="carousel-caption">{image.alt}</figcaption>
              </figure>
            );
          })}
        </div>
        <div className="carousel-controls">
          <button
            type="button"
            className="btn ghost"
            onClick={() => goToSlide(activeIndex - 1, { method: "button_previous" })}
            aria-label="Previous image"
          >
            ‹
          </button>
          <div className="carousel-dots" role="tablist" aria-label="Image slides">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                className={`carousel-dot${index === activeIndex ? " is-active" : ""}`}
                aria-label={`Show slide ${index + 1}`}
                aria-selected={index === activeIndex}
                role="tab"
                onClick={() => goToSlide(index, { method: "dot_click" })}
              />
            ))}
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={() => goToSlide(activeIndex + 1, { method: "button_next" })}
            aria-label="Next image"
          >
            ›
          </button>
        </div>
        <p className="carousel-counter">
          Image {activeIndex + 1} of {images.length}
        </p>
      </main>
    </div>
  );
}
