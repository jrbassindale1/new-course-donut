import SceneHeading from "../components/SceneHeading.jsx";

function resolveAsset(path) {
  if (!path) {
    return "";
  }

  if (/^https?:/i.test(path)) {
    return path;
  }

  try {
    return new URL(`../../../../${path}`, import.meta.url).href;
  } catch (error) {
    console.warn("Unable to resolve asset", path, error);
    return path;
  }
}

export default function PathwayScene({ scene }) {
  const steps = scene?.steps || [];
  const accreditations = scene?.accreditations || [];

  return (
    <div className="story-scene story-scene--pathway">
      <SceneHeading scene={scene} />
      <div className="story-pathway">
        <div className="story-pathway-track" role="list">
          {steps.map((step, index) => {
            const key = step?.id || step?.title || index;
            const cardClass = ["story-pathway-card", step?.id ? `story-pathway-card--${step.id}` : ""].filter(Boolean).join(" ");

            return (
              <article key={key} className={cardClass} role="listitem">
                {step?.stage ? <span className="story-pathway-stage">{step.stage}</span> : null}
                {step?.title ? <h3 className="story-pathway-title">{step.title}</h3> : null}
                {step?.description ? <p className="story-pathway-description">{step.description}</p> : null}
              </article>
            );
          })}
        </div>

        {scene?.note?.title || scene?.note?.description ? (
          <div className="story-pathway-note">
            {scene.note.title ? <p className="story-pathway-note-title">{scene.note.title}</p> : null}
            {scene.note.description ? <p>{scene.note.description}</p> : null}
          </div>
        ) : null}

        {scene?.accreditationDescription || accreditations.length ? (
          <section className="story-pathway-accreditation" aria-label="Course accreditations">
            {scene?.accreditationDescription ? <p>{scene.accreditationDescription}</p> : null}
            {accreditations.length ? (
              <div className="story-pathway-logos">
                {accreditations.map((logo, index) => {
                  const key = logo?.id || logo?.label || logo?.image || index;
                  const src = resolveAsset(logo?.image);

                  return (
                    <figure key={key} className="story-pathway-logo">
                      {logo?.image ? <img src={src} alt={logo?.alt || logo?.label || ""} loading="lazy" /> : null}
                      {logo?.label ? <figcaption className="story-pathway-logo-label">{logo.label}</figcaption> : null}
                    </figure>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : null}
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
