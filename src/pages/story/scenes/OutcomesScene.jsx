import SceneHeading from "../components/SceneHeading.jsx";

export default function OutcomesScene({ scene }) {
  return (
    <div className="story-scene story-scene--outcomes">
      <SceneHeading scene={scene} />
      <div className="story-outcome-cards">
        {(scene?.stats || []).map((stat) => (
          <article key={stat.id} className="story-outcome-card">
            {stat?.value ? <p className="story-outcome-value">{stat.value}</p> : null}
            {stat?.metric ? <p className="story-outcome-metric">{stat.metric}</p> : null}
            {stat?.source ? <p className="story-outcome-source">{stat.source}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
