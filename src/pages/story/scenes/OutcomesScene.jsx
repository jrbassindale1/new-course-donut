import SceneHeading from "../components/SceneHeading.jsx";

export default function OutcomesScene({ scene }) {
  const stats = scene?.stats || [];
  const narrative = scene?.narrative;
  const highlightSentence = "Our students don’t just learn — they make an impact.";
  const narrativeText = narrative?.text || "";
  const highlightIndex = narrativeText.indexOf(highlightSentence);
  const hasHighlight = highlightIndex !== -1;
  const beforeHighlight = hasHighlight ? narrativeText.slice(0, highlightIndex) : narrativeText;
  const afterHighlight = hasHighlight
    ? narrativeText.slice(highlightIndex + highlightSentence.length)
    : "";

  return (
    <div className="story-scene story-scene--outcomes">
      <SceneHeading scene={scene} />
      <div className="story-outcome-cards">
        {stats.map((stat) => (
          <article key={stat.id} className="story-outcome-card">
            {stat?.value ? <p className="story-outcome-value">{stat.value}</p> : null}
            {stat?.metric ? <p className="story-outcome-metric">{stat.metric}</p> : null}
            {stat?.source ? <p className="story-outcome-source">{stat.source}</p> : null}
          </article>
        ))}
      </div>
      {narrative ? (
        <section className="story-outcome-narrative">
          {narrative.title ? (
            <h2 className="story-outcome-narrative-title">{narrative.title}</h2>
          ) : null}
          {narrativeText ? (
            <p className="story-outcome-narrative-text">
              {hasHighlight ? (
                <>
                  {beforeHighlight}
                  <span className="story-outcome-keep">{highlightSentence}</span>
                  {afterHighlight}
                </>
              ) : (
                narrativeText
              )}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
