import SceneHeading from "../components/SceneHeading.jsx";
import qrPlaceholder from "../../../../images/story/qr-placeholder.svg";

export default function ContactScene({ scene }) {
  return (
    <div className="story-scene story-scene--contact">
      <SceneHeading scene={scene} />
      <div className="story-contact-grid">
        <div className="story-contact-block story-contact-block--qr-only">
          <h2>Explore this presentation</h2>
          <div className="story-contact-qr">
            <img src={qrPlaceholder} alt="Scan the QR code to save these contact details" />
            <span>Scan to save our details</span>
          </div>
        </div>
        <div className="story-contact-block story-contact-block--details">
          <h2>Contact</h2>
          <ul>
            {(scene?.contacts || []).map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                {item?.href ? (
                  <strong>
                    <a href={item.href} target="_blank" rel="noreferrer">{item.value}</a>
                  </strong>
                ) : (
                  <strong>{item.value}</strong>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="story-contact-block">
          <h2>Useful links</h2>
          <ul className="story-contact-links">
            {(scene?.links || []).map((link) => (
              <li className="story-contact-links__item" key={link.label}>
                <a
                  className="story-contact-link"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="story-contact-block story-contact-apply">
          <h2>How to apply</h2>
          {Array.isArray(scene?.apply?.details) && scene.apply.details.length > 0 ? (
            <ul className="story-contact-apply-details">
              {scene.apply.details.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </li>
              ))}
            </ul>
          ) : null}
          {scene?.apply?.href ? (
            <a
              className="btn story-contact-apply-btn"
              href={scene.apply.href}
              target="_blank"
              rel="noreferrer"
            >
              {scene.apply.label || "Apply now"}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
