import { useEffect, useMemo, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion.js";
import { withBase } from "../../../utils/withBase.js";

export default function DestinationsScene({ scene }) {
  const companies = useMemo(
    () => (Array.isArray(scene?.companies) ? scene.companies : []),
    [scene],
  );
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

  const [activeState, setActiveState] = useState(() => gridItems.map(() => false));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    setActiveState(gridItems.map(() => false));
    setHoveredIndex(null);
  }, [gridItems]);

  useEffect(() => {
    if (reduceMotion || !gridItems.length) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveState((prev) => {
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
          const isActive = (activeState[index] && !reduceMotion) || hoveredIndex === index;
          return (
            <button
              key={`${company.id}-${index}`}
              type="button"
              className={`story-destination-cell${isActive ? " is-active" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
            >
              <div className={`story-destination-inner${isActive ? " is-active" : ""}`}>
                <div className="story-destination-face story-destination-front">
                  {company.logo ? (
                    <img src={withBase(company.logo)} alt={company.name} className="story-destination-logo" />
                  ) : (
                    <span className="story-destination-text">{company.name}</span>
                  )}
                </div>
                <div className="story-destination-face story-destination-back">
                  {company.image ? (
                    <img
                      src={withBase(company.image)}
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
      {scene?.footerNote ? (
        <div className="story-destinations-note">
          {(Array.isArray(scene.footerNote) ? scene.footerNote : [scene.footerNote]).map(
            (paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
