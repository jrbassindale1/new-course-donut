import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

export default function StudioScene({ scene }) {
  return (
    <div className="story-scene story-scene--studio">
      <SceneHeading scene={scene} />
      <div className="story-studio-grid">
        {(scene?.pins || []).map((pin) => (
          <article key={pin.id} className="story-pin-card">
            <div className="story-pin-media" aria-hidden="true">
              <div className="story-pin-thumb" style={{ backgroundImage: `url(${withBase(pin?.fallback) || ""})` }} />
            </div>
            {(pin?.title || pin?.caption) ? (
              <div className="story-pin-body">
                {pin?.title ? <h3>{pin.title}</h3> : null}
                {pin?.caption ? <p>{pin.caption}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
