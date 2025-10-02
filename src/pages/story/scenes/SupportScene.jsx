import SceneHeading from "../components/SceneHeading.jsx";

export default function SupportScene({ scene }) {
  const services = Array.isArray(scene?.services) ? scene.services : [];
  const linkHref = scene?.link?.href;
  const linkLabel = scene?.link?.label || "Find out more";
  const imageSrc = scene?.image;
  const imageAlt = scene?.imageAlt || 'Support team';

  return (
    <div className="story-scene story-scene--support">
      <SceneHeading scene={scene} />
      <div className="story-support-panel">
        <div className="story-support-body">
          {services.length > 0 ? (
            <ul className="story-support-list">
              {services.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {linkHref ? (
            <a
              className="story-support-link"
              href={linkHref}
              target="_blank"
              rel="noreferrer"
            >
              {linkLabel}
            </a>
          ) : null}
        </div>
        {imageSrc ? (
          <figure className="story-support-figure">
            <img src={imageSrc} alt={imageAlt} />
          </figure>
        ) : null}
      </div>
    </div>
  );
}
