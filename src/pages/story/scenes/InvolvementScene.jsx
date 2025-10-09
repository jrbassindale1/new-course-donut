import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

export default function InvolvementScene({ scene }) {
  const intro = Array.isArray(scene?.intro)
    ? scene.intro
    : scene?.intro
      ? [scene.intro]
      : [];
  const features = Array.isArray(scene?.features) ? scene.features : [];

  return (
    <div className="story-scene story-scene--involvement">
      <SceneHeading scene={scene} />
      {intro.length ? (
        <div className="story-involvement-intro">
          {intro.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {features.length ? (
        <div className="story-involvement-grid">
          {features.map((feature) => {
            const points = Array.isArray(feature?.points) ? feature.points : [];
            const imageSrc = feature?.image;
            const imageAlt = feature?.imageAlt || feature?.title || "Involvement highlight";
            return (
              <div className="story-involvement-card" key={feature.id || feature.title}>
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
                {feature.eyebrow ? (
                  <span className="story-involvement-eyebrow">{feature.eyebrow}</span>
                ) : null}
                <h3 className="story-involvement-card-title">{feature.title}</h3>
                {feature.description ? (
                  <p className="story-involvement-card-description">{feature.description}</p>
                ) : null}
                {points.length ? (
                  <ul className="story-involvement-points">
                    {points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {feature.linkHref ? (
                  <a
                    className="story-involvement-link"
                    href={feature.linkHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {feature.linkLabel || "Discover more"}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
