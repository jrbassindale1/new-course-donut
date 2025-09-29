import SceneHeading from "../components/SceneHeading.jsx";

export default function LeadersScene({ scene }) {
  return (
    <div className="story-scene story-scene--leaders">
      <SceneHeading scene={scene} />
      <div className="story-leaders-grid">
        {(scene?.leaders || []).map((leader) => (
          <article key={leader.id} className="story-leader-card">
            <div className="story-leader-photo" style={{ backgroundImage: `url(${leader?.image || ""})` }} />
            <div className="story-leader-body">
              {leader?.name ? <h3>{leader.name}</h3> : null}
              {leader?.role ? <p className="story-leader-role">{leader.role}</p> : null}
              {leader?.bio ? <p>{leader.bio}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
