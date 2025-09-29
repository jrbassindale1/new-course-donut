import { useEffect, useMemo, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import programmeInfo from "../../../data/programmeInfo.json";

export default function YearScene({ scene }) {
  const tiles = Array.isArray(scene?.tiles) ? scene.tiles : [];
  const slides = tiles
    .map((tile, index) => (tile?.image ? { ...tile, tileIndex: index } : null))
    .filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((current) => {
      if (current < 0 || current >= slides.length) {
        return 0;
      }
      return current;
    });
  }, [slides.length]);

  const programmeOutcomes = useMemo(() => {
    if (!Array.isArray(scene?.outcomeCodes) || !Array.isArray(programmeInfo?.outcomes)) {
      return [];
    }
    return scene.outcomeCodes
      .map((code) => programmeInfo.outcomes.find((outcome) => outcome?.code === code))
      .filter(Boolean);
  }, [scene?.outcomeCodes]);

  const handleSelectSlide = (index) => {
    if (!Number.isInteger(index)) return;
    setActiveIndex((current) => {
      if (!slides.length) return current;
      const boundedIndex = ((index % slides.length) + slides.length) % slides.length;
      return boundedIndex;
    });
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectSlide(index);
    }
  };

  const handlePrevious = () => {
    if (!slides.length) return;
    handleSelectSlide(activeIndex - 1);
  };

  const handleNext = () => {
    if (!slides.length) return;
    handleSelectSlide(activeIndex + 1);
  };

  return (
    <div className="story-scene story-scene--year">
      <SceneHeading scene={scene} />
      <div className="story-year-layout">
        <div className="story-year-themes-column">
          {tiles.map((tile, index) => {
            const slideIndex = slides.findIndex((slide) => slide.tileIndex === index);
            const isInteractive = slideIndex !== -1;
            const isActive = slideIndex === activeIndex && isInteractive;

            const handleInteraction = () => {
              if (!isInteractive) return;
              handleSelectSlide(slideIndex);
            };

            return (
              <article
                key={tile.track}
                className={`story-year-theme-card${isActive ? " is-active" : ""}`}
                tabIndex={isInteractive ? 0 : -1}
                role="button"
                aria-pressed={isActive}
                aria-disabled={!isInteractive}
                onClick={handleInteraction}
                onMouseEnter={handleInteraction}
                onFocus={handleInteraction}
                onKeyDown={(event) => {
                  if (!isInteractive) return;
                  handleKeyDown(event, slideIndex);
                }}
              >
                <p className="story-journey-track">{tile.track}</p>
              </article>
            );
          })}
        </div>
        {slides.length ? (
          <div className="story-year-carousel" aria-live="polite">
            <div className="story-year-carousel-viewport">
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                  <figure
                    key={`${slide.track}-${slide.image}`}
                    className={`story-year-carousel-slide${isActive ? " is-active" : ""}`}
                    style={{ backgroundImage: `url(${slide.image})` }}
                    aria-hidden={!isActive}
                  >
                    <figcaption>
                      <span className="story-year-carousel-track">{slide.track}</span>
                    </figcaption>
                  </figure>
                );
              })}
              <button
                type="button"
                className="story-year-carousel-nav story-year-carousel-nav--previous"
                onClick={handlePrevious}
                aria-label="Previous project"
              >
                ‹
              </button>
              <button
                type="button"
                className="story-year-carousel-nav story-year-carousel-nav--next"
                onClick={handleNext}
                aria-label="Next project"
              >
                ›
              </button>
            </div>
            <div className="story-year-carousel-dots" role="tablist" aria-label="Select project">
              {slides.map((slide, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={`${slide.track}-dot`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`story-year-carousel-dot${isActive ? " is-active" : ""}`}
                    onClick={() => handleSelectSlide(index)}
                  >
                    <span className="sr-only">{slide.track}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      {programmeOutcomes.length ? (
        <div className="story-year-outcomes">
          <h3 className="story-year-outcomes-title">Programme outcomes highlighted this year</h3>
          <ul>
            {programmeOutcomes.map((outcome) => (
              <li key={outcome.code}>
                <span className="story-year-outcome-code">{outcome.code}</span>
                <span className="story-year-outcome-text">{outcome.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {scene?.footnote ? <p className="story-footnote">{scene.footnote}</p> : null}
    </div>
  );
}
