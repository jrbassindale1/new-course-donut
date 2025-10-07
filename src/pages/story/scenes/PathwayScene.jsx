import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

const STORY_ASSET_MAP = buildStoryAssetMap();

function buildStoryAssetMap() {
  const modules = import.meta.glob("../../../../images/story/**/*", {
    eager: true,
    query: "?url",
    import: "default",
  });

  const assets = {};

  for (const [modulePath, url] of Object.entries(modules)) {
    if (!url) continue;

    const normalisedModulePath = modulePath.replace(/\\/g, "/");
    const afterImagesSegment = normalisedModulePath.split("/images/")[1];
    if (!afterImagesSegment) continue;

    const withImagesPrefix = `images/${afterImagesSegment}`;
    const normalisedKey = withImagesPrefix.replace(/^\/+/, "");

    assets[normalisedKey] = url;
    assets[normalisedKey.toLowerCase()] = url;
  }

  return assets;
}

function resolveAsset(path) {
  if (!path) {
    return "";
  }

  if (/^https?:/i.test(path)) {
    return path;
  }

  const normalisedPath = path.replace(/\\/g, "/").replace(/^\/+/, "");

  return (
    STORY_ASSET_MAP[normalisedPath] ||
    STORY_ASSET_MAP[normalisedPath.toLowerCase()] ||
    path
  );
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
            const uniqueKeyBase = step?.id || step?.title;
            const key = uniqueKeyBase ? `${uniqueKeyBase}-${index}` : index;
            const cardClass = [
              "story-pathway-card",
              step?.id ? `story-pathway-card--${step.id}` : "",
            ]
              .filter(Boolean)
              .join(" ");

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
                  const _raw = resolveAsset(logo?.image) || "";
                  // If someone accidentally put a leading slash before a data URL ("/data:image…"), strip it
                  const trimmed = _raw.replace(/^\/+(?=data:)/i, "");
                  const src = /^(https?:|data:|blob:)/i.test(trimmed)
                    ? trimmed
                    : trimmed.startsWith("/")
                      ? trimmed
                      : withBase(trimmed);

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
