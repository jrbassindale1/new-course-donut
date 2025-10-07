import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

export default function BristolScene({ scene }) {
  return (
    <div className="story-scene story-scene--bristol">
      <SceneHeading scene={scene} />
      <div className="story-bristol-grid">
        {(scene?.sections || []).map((section) => (
          <article key={section.title} className="story-bristol-card">
            {section?.image ? (
              <div className="story-bristol-card__media">
                <img src={withBase(section.image)} alt={section.alt || section.title || ""} loading="lazy" />
              </div>
            ) : null}
            {section?.title || section?.copy ? (
              <div className="story-bristol-card__body">
                {section?.title ? <h3>{section.title}</h3> : null}
                {section?.copy ? <p>{section.copy}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {scene?.link?.href ? (
        <a className="btn secondary" href={scene.link.href} target="_blank" rel="noreferrer">
          {scene.link.label || "Discover Bristol"}
        </a>
      ) : null}
    </div>
  );
}
