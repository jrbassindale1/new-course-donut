import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

function HighlightCard({ highlight }) {
  if (!highlight) return null;
  const points = Array.isArray(highlight.points) ? highlight.points : [];
  const imageSrc = highlight.image;
  const imageAlt = highlight.imageAlt || highlight.title || "Support highlight";

  return (
    <div className="story-involvement-card story-support-highlight-card">
      <div className="story-involvement-card-media">
        {imageSrc ? (
          <img
            className="story-involvement-photo"
            src={withBase(imageSrc)}
            alt={imageAlt}
            loading="lazy"
          />
        ) : (
          <div className="story-involvement-photo story-involvement-photo--placeholder">
            <span>Photo coming soon</span>
          </div>
        )}
      </div>
      {highlight.eyebrow ? <span className="story-involvement-eyebrow">{highlight.eyebrow}</span> : null}
      <h3 className="story-involvement-card-title">{highlight.title}</h3>
      {highlight.description ? (
        <p className="story-involvement-card-description">{highlight.description}</p>
      ) : null}
      {points.length ? (
        <ul className="story-involvement-points">
          {points.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      ) : null}
      {highlight.linkHref ? (
        <a className="story-involvement-link" href={highlight.linkHref} target="_blank" rel="noreferrer">
          {highlight.linkLabel || "Find out more"}
        </a>
      ) : null}
    </div>
  );
}

export default function SupportScene({ scene }) {
  const services = Array.isArray(scene?.services) ? scene.services : [];
  const linkHref = scene?.link?.href;
  const linkLabel = scene?.link?.label || "Find out more";
  const highlight = scene?.highlight;

  return (
    <div className="story-scene story-scene--support">
      <SceneHeading scene={scene} />
      <div className="story-support-layout">
        {highlight ? <HighlightCard highlight={highlight} /> : null}
        <div className="story-support-panel">
          <div className="story-support-body">
            <h3 className="story-support-list-title">On-campus support</h3>
            {services.length > 0 ? (
              <ul className="story-support-list">
                {services.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {linkHref ? (
              <a className="story-support-link" href={linkHref} target="_blank" rel="noreferrer">
                {linkLabel}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
