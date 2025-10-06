import SceneHeading from "../components/SceneHeading.jsx";

export default function ProjectsScene({ scene }) {
  return (
    <div className="story-scene story-scene--projects">
      <SceneHeading scene={scene} />
      <div className="story-studio-grid story-projects-grid">
        {(scene?.tiles || []).map((tile) => (
          <article key={tile.id} className="story-pin-card story-project-card">
            <div className="story-pin-media" aria-hidden="true">
              <div
                className="story-pin-thumb"
                style={tile?.image ? { backgroundImage: `url("${tile.image}")` } : undefined}
              />
            </div>
            {(tile?.title || tile?.caption) ? (
              <div className="story-pin-body">
                {tile?.title ? <h3>{tile.title}</h3> : null}
                {tile?.caption ? <p>{tile.caption}</p> : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
