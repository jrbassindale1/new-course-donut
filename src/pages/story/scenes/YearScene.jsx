import { useEffect, useMemo, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";

const YEAR_CAROUSEL_GALLERIES = buildYearCarouselGalleries();
const AUTO_ADVANCE_INTERVAL = 10000;

function buildYearCarouselGalleries() {
  const modules = import.meta.glob(
    "../../../../images/**/*.{jpg,jpeg,png,gif,webp,avif,JPG,JPEG,PNG,GIF,WEBP,AVIF}",
    {
      eager: true,
      import: "default",
    },
  );

  const allowedYears = new Set(["firstyear", "secondyear", "thirdyear"]);
  const galleries = Object.create(null);

  for (const [path, moduleUrl] of Object.entries(modules)) {
    const url = typeof moduleUrl === "string" ? moduleUrl : moduleUrl?.default;
    if (!url) continue;

    const normalisedPath = path.replace(/\\/g, "/");
    const afterImages = normalisedPath.split("/images/")[1];
    if (!afterImages) continue;

    const segments = afterImages.split("/").filter(Boolean);
    if (segments.length < 3) continue;

    const [year, theme, ...rest] = segments;
    const yearKey = year?.toLowerCase();
    const themeKey = theme?.toLowerCase();
    if (!yearKey || !themeKey || !allowedYears.has(yearKey)) continue;

    const folderKey = `${yearKey}/${themeKey}`;
    const filename = rest.join("/");
    const label = deriveImageLabel(filename);

    if (!galleries[folderKey]) {
      galleries[folderKey] = [];
    }

    galleries[folderKey].push({
      url,
      filename,
      label,
    });
  }

  Object.keys(galleries).forEach((key) => {
    galleries[key]
      .sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      )
      .forEach((entry, index, array) => {
        entry.index = index;
        entry.count = array.length;
      });
  });

  return galleries;
}

function deriveImageLabel(filename = "") {
  const baseName = filename.split("/").pop()?.replace(/\.[^.]+$/, "");
  if (!baseName) return "";

  return baseName
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normaliseFolderKey(folder) {
  if (!folder) return null;
  const cleaned = folder
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^images\//i, "")
    .trim();

  const segments = cleaned.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const [year, theme] = segments;
  return `${year.toLowerCase()}/${theme.toLowerCase()}`;
}

function createSlidesForTile(tile, tileIndex) {
  if (!tile) return [];

  const folderKey = normaliseFolderKey(tile.imageFolder);
  const gallery = folderKey ? YEAR_CAROUSEL_GALLERIES[folderKey] : null;

  if (Array.isArray(gallery) && gallery.length) {
    return gallery.map((entry, index, array) => {
      const labelText = entry.label ? `${tile.track} — ${entry.label}` : tile.track;
      return {
        tileIndex,
        track: tile.track,
        deliverable: tile.deliverable,
        image: entry.url,
        imageLabel: entry.label,
        altText: labelText,
        slideIndex: index,
        slideCount: array.length,
      };
    });
  }

  return [];
}

export default function YearScene({ scene }) {
  const tiles = Array.isArray(scene?.tiles) ? scene.tiles : [];
  const { tileSlides, firstInteractiveTileIndex } = useMemo(() => {
    const slidesByTile = tiles.map((tile, index) => createSlidesForTile(tile, index));
    const firstInteractive = slidesByTile.findIndex((entry) => entry.length > 0);
    return {
      tileSlides: slidesByTile,
      firstInteractiveTileIndex: firstInteractive,
    };
  }, [tiles]);

  const [activeTileIndex, setActiveTileIndex] = useState(() =>
    firstInteractiveTileIndex !== -1 ? firstInteractiveTileIndex : 0,
  );
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (firstInteractiveTileIndex === -1) {
      setActiveTileIndex(0);
      setActiveSlideIndex(0);
      return;
    }

    setActiveTileIndex((current) => {
      if (tileSlides[current]?.length) {
        return current;
      }
      return firstInteractiveTileIndex;
    });
  }, [firstInteractiveTileIndex, tileSlides]);

  useEffect(() => {
    setActiveSlideIndex(0);
  }, [activeTileIndex]);

  useEffect(() => {
    const slidesForTile = tileSlides[activeTileIndex];
    if (!slidesForTile?.length) {
      setActiveSlideIndex(0);
      return;
    }

    setActiveSlideIndex((current) => {
      if (current < 0 || current >= slidesForTile.length) {
        return 0;
      }
      return current;
    });
  }, [activeTileIndex, tileSlides]);

  const activeSlides = tileSlides[activeTileIndex] ?? [];
  const activeSlideCount = activeSlides.length;
  const hasAnySlides = tileSlides.some((entry) => entry.length > 0);
  const activeSlide = activeSlides[activeSlideIndex] ?? null;

  const handleSelectTile = (index) => {
    if (!Number.isInteger(index)) return;
    const slidesForTile = tileSlides[index];
    if (!slidesForTile?.length) return;
    setActiveTileIndex(index);
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectTile(index);
    }
  };

  const handleSelectSlide = (index) => {
    if (!Number.isInteger(index) || !activeSlideCount) return;
    const boundedIndex = ((index % activeSlideCount) + activeSlideCount) % activeSlideCount;
    setActiveSlideIndex(boundedIndex);
  };

  const handlePrevious = () => {
    if (!activeSlideCount) return;
    handleSelectSlide(activeSlideIndex - 1);
  };

  const handleNext = () => {
    if (!activeSlideCount) return;
    handleSelectSlide(activeSlideIndex + 1);
  };

  useEffect(() => {
    if (activeSlideCount < 2 || typeof window === "undefined") return undefined;

    const timer = window.setInterval(() => {
      setActiveSlideIndex((current) => {
        const nextIndex = current + 1;
        return nextIndex >= activeSlideCount ? 0 : nextIndex;
      });
    }, AUTO_ADVANCE_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSlideCount, activeTileIndex]);

  return (
    <div className="story-scene story-scene--year">
      <SceneHeading scene={scene} />
      <div className="story-year-layout">
        <div className="story-year-themes-column">
          {tiles.map((tile, index) => {
            const slidesForTile = tileSlides[index];
            const isInteractive = Array.isArray(slidesForTile) && slidesForTile.length > 0;
            const isActive = index === activeTileIndex && isInteractive;

            const handleInteraction = () => {
              if (!isInteractive) return;
              handleSelectTile(index);
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
                  handleKeyDown(event, index);
                }}
              >
                <div className="story-year-theme-header">
                  <h3 className="story-year-theme-title">{tile.track}</h3>
                  {tile?.deliverable ? (
                    <p className="story-year-theme-subtitle">{tile.deliverable}</p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
        <div
          className={`story-year-carousel${hasAnySlides ? "" : " story-year-carousel--empty"}`}
          aria-live="polite"
        >
          {hasAnySlides ? (
            <>
              <div className="story-year-carousel-viewport">
                {activeSlides.map((slide, index) => {
                  const isActive = index === activeSlideIndex;
                  return (
                    <figure
                      key={`${slide.track}-${slide.image}-${index}`}
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
                  aria-label={
                    activeSlide?.altText
                      ? `Previous image for ${activeSlide.altText}`
                      : "Previous project image"
                  }
                  disabled={activeSlideCount < 2}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="story-year-carousel-nav story-year-carousel-nav--next"
                  onClick={handleNext}
                  aria-label={
                    activeSlide?.altText
                      ? `Next image for ${activeSlide.altText}`
                      : "Next project image"
                  }
                  disabled={activeSlideCount < 2}
                >
                  ›
                </button>
              </div>
              {activeSlideCount > 1 ? (
                <div className="story-year-carousel-dots" role="tablist" aria-label="Select project image">
                  {activeSlides.map((slide, index) => {
                    const isActive = index === activeSlideIndex;
                    const labelText = slide.imageLabel ? `${slide.track} — ${slide.imageLabel}` : slide.track;
                    return (
                      <button
                        key={`${slide.track}-dot-${index}`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`story-year-carousel-dot${isActive ? " is-active" : ""}`}
                        onClick={() => handleSelectSlide(index)}
                      >
                        <span className="sr-only">{labelText}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <div className="story-year-carousel-placeholder">
              <p>Project imagery coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
