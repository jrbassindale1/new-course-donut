import { useEffect, useMemo, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion.js";

export default function DestinationsScene({ scene }) {
  const companies = scene?.companies || [];
  const reduceMotion = usePrefersReducedMotion();

  const gridItems = useMemo(() => {
    if (!companies.length) return [];
    const total = 10;
    const items = [];
    for (let i = 0; i < total; i += 1) {
      const company = companies[i % companies.length];
      items.push({ ...company, gridIndex: i });
    }
    return items;
  }, [companies]);

  const [flippedState, setFlippedState] = useState(() => gridItems.map(() => false));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    setFlippedState(gridItems.map(() => false));
    setHoveredIndex(null);
  }, [gridItems]);

  useEffect(() => {
    if (reduceMotion || !gridItems.length) return undefined;
    const intervalId = window.setInterval(() => {
      setFlippedState((prev) => {
        if (!prev.length) return prev;
        const next = prev.slice();
        const randomIndex = Math.floor(Math.random() * next.length);
        next[randomIndex] = !next[randomIndex];
        return next;
      });
    }, 3600);
    return () => window.clearInterval(intervalId);
  }, [gridItems.length, reduceMotion]);

  return (
    <div className="story-scene story-scene--destinations">
      <SceneHeading scene={scene} />
      <div className="story-destinations-grid" aria-label="Graduate destinations grid">
        {gridItems.map((company, index) => {
          const isFlipped = (flippedState[index] && !reduceMotion) || hoveredIndex === index;
          return (
            <button
              key={`${company.id}-${index}`}
              type="button"
              className={`story-destination-cell${isFlipped ? " is-flipped" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
            >
              <div className="story-destination-inner">
                <div className="story-destination-face story-destination-front">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="story-destination-logo" />
                  ) : (
                    <span className="story-destination-text">{company.name}</span>
                  )}
                </div>
                <div className="story-destination-face story-destination-back">
                  {company.image ? (
                    <img
                      src={company.image}
                      alt={company.alt || company.name}
                      className="story-destination-photo"
                    />
                  ) : null}
                  <div className="story-destination-backdrop" />
                  <div className="story-destination-back-meta">
                    <span className="story-destination-name">{company.name}</span>
                    {company.link ? (
                      <a
                        className="story-destination-link"
                        href={company.link}
                        target="_blank"
                        rel="noreferrer"
                        tabIndex={-1}
                      >
                        Visit site
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
