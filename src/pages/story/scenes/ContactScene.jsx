import SceneHeading from "../components/SceneHeading.jsx";

export default function ContactScene({ scene }) {
  return (
    <div className="story-scene story-scene--contact">
      <SceneHeading scene={scene} />
      <div className="story-contact-grid">
        <div className="story-contact-block">
          <h2>Contact</h2>
          <ul>
            {(scene?.contacts || []).map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="story-contact-block">
          <h2>Useful links</h2>
          <ul>
            {(scene?.links || []).map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="story-contact-block story-contact-apply">
          <h2>How to apply</h2>
          {scene?.apply?.href ? (
            <a className="btn" href={scene.apply.href} target="_blank" rel="noreferrer">
              {scene.apply.label || "Apply now"}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
