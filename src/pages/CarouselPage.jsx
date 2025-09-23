import React, { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, AUTO_PLAY_INTERVAL);
    return () => window.clearInterval(id);
  }, [images.length]);

  const goToSlide = (nextIndex) => {
    setActiveIndex(((nextIndex % images.length) + images.length) % images.length);
  };

  const handleNavigateHome = (event) => {
    if (onNavigate) {
      event?.preventDefault?.();
      onNavigate("chart");
    }
  };

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
                <img src={image.src} alt={image.alt} className="carousel-image" />
                <figcaption className="carousel-caption">{image.alt}</figcaption>
              </figure>
            );
          })}
        </div>
        <div className="carousel-controls">
          <button
            type="button"
            className="btn ghost"
            onClick={() => goToSlide(activeIndex - 1)}
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
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
          <button
            type="button"
            className="btn ghost"
            onClick={() => goToSlide(activeIndex + 1)}
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