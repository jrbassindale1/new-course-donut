import SceneHeading from "../components/SceneHeading.jsx";

export default function StudioScene({ scene }) {
  return (
    <div className="story-scene story-scene--studio">
      <SceneHeading scene={scene} />
      <div className="story-studio-grid">
        {(scene?.pins || []).map((pin) => (
          <div key={pin.id} className="story-pin-card">
            <div className="story-pin-media" aria-hidden="true">
              <div className="story-pin-thumb" style={{ backgroundImage: `url(${pin?.fallback || ""})` }} />
            </div>
            <div className="story-pin-body">
              {pin?.title ? <h3>{pin.title}</h3> : null}
              {pin?.caption ? <p>{pin.caption}</p> : null}
              <p className="story-pin-meta">
                <span className="story-pin-type">{pin?.type || "Loop / Still"}</span>
                <span className="story-pin-src">{pin?.media || "TBC"}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
