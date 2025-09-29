import SceneHeading from "../components/SceneHeading.jsx";

export default function ProjectsScene({ scene }) {
  return (
    <div className="story-scene story-scene--projects">
      <SceneHeading scene={scene} />
      <div className="story-projects-grid">
        {(scene?.tiles || []).map((tile) => (
          <button key={tile.id} type="button" className="story-project-card">
            <div className="story-project-media" style={{ backgroundImage: `url(${tile?.image || ""})` }} />
            <div className="story-project-overlay">
              {tile?.title ? <h3>{tile.title}</h3> : null}
              {tile?.caption ? <p>{tile.caption}</p> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
