import SceneHeading from "../components/SceneHeading.jsx";

export default function PathwayScene({ scene }) {
  return (
    <div className="story-scene story-scene--pathway">
      <SceneHeading scene={scene} />
      <div className="story-pathway">
        {(scene?.steps || []).map((step, index) => (
          <div key={step} className="story-pathway-step">
            <div className="story-pathway-node">
              <span>{index + 1}</span>
            </div>
            <p>{step}</p>
          </div>
        ))}
      </div>
      {scene?.cta?.href ? (
        <div className="story-pathway-cta">
          <a className="btn" href={scene.cta.href} target="_blank" rel="noreferrer">
            {scene.cta.label || "Request a call"}
          </a>
        </div>
      ) : null}
    </div>
  );
}
