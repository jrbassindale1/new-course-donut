import SceneHeading from "../components/SceneHeading.jsx";

export default function BristolScene({ scene }) {
  return (
    <div className="story-scene story-scene--bristol">
      <SceneHeading scene={scene} />
      <div className="story-bristol-grid">
        {(scene?.sections || []).map((section) => (
          <article key={section.title} className="story-bristol-card">
            {section?.title ? <h3>{section.title}</h3> : null}
            {section?.copy ? <p>{section.copy}</p> : null}
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
