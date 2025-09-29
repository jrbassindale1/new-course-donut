import { useCallback, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";

export default function WelcomeScene({ scene }) {
  const [activeCard, setActiveCard] = useState(null);

  const handleCardToggle = useCallback((index) => {
    setActiveCard((prev) => (prev === index ? null : index));
  }, []);

  const handleCardEnter = useCallback((index) => {
    setActiveCard(index);
  }, []);

  const handleCardLeave = useCallback((index) => {
    setActiveCard((prev) => (prev === index ? null : prev));
  }, []);

  return (
    <div className="story-scene story-scene--welcome">
      <SceneHeading scene={scene} />
      <div className="story-welcome-hero">
        <aside className="story-hero-media" aria-hidden="true">
          <div
            className="story-hero-image"
            style={{ backgroundImage: `url(${scene?.background?.src || ""})` }}
          />
          <ul className="story-keywords">
            {(scene?.background?.keywords || []).map((keyword) => (
              <li key={keyword}>{keyword}</li>
            ))}
          </ul>
        </aside>
        <div className="story-welcome-content">
          {Array.isArray(scene?.sections) && scene.sections.length > 0 ? (
            <ul className="story-welcome-grid" role="list">
              {scene.sections.map((section, index) => {
                const key = section?.title ? `${section.title}-${index}` : `section-${index}`;
                const isFlipped = activeCard === index;
                return (
                  <li key={key} className="story-welcome-card">
                    <button
                      type="button"
                      className={`story-welcome-card-toggle${isFlipped ? " is-active" : ""}`}
                      aria-pressed={isFlipped}
                      aria-label={`Read more about ${section?.title || "this highlight"}`}
                      onMouseEnter={() => handleCardEnter(index)}
                      onMouseLeave={() => handleCardLeave(index)}
                      onFocus={() => handleCardEnter(index)}
                      onBlur={() => handleCardLeave(index)}
                      onClick={() => handleCardToggle(index)}
                    >
                      <span className={`story-welcome-card-inner${isFlipped ? " is-flipped" : ""}`}>
                        <span className="story-welcome-card-face is-front">
                          {section?.title ? <h3>{section.title}</h3> : null}
                        </span>
                        <span className="story-welcome-card-face is-back">
                          {section?.copy ? <p>{section.copy}</p> : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {scene?.qr?.href || scene?.link?.href ? (
            <div className="story-welcome-meta">
              {scene?.qr?.href ? (
                <a className="story-qr" href={scene.qr.href} target="_blank" rel="noreferrer">
                  {scene.qr.label || "Share"}
                </a>
              ) : null}
              {scene?.link?.href ? (
                <a
                  className="story-welcome-link"
                  href={scene.link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {scene.link.label || "See full course details"}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
