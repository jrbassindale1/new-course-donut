import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

export default function CourseSpectrumScene({ scene }) {
  const startLabel = scene?.spectrum?.startLabel || "Creative";
  const endLabel = scene?.spectrum?.endLabel || "Technical";
  const items = Array.isArray(scene?.spectrum?.items) ? scene.spectrum.items : [];
  const startIcon = withBase("/images/icons/noun-creativity-7236902.svg");
  const endIcon = withBase("/images/icons/noun-construction-8105758.svg");

  return (
    <div className="story-scene story-scene--course-spectrum">
      <SceneHeading scene={scene} />
      <div className="story-spectrum">
        <div className="story-spectrum-bar" aria-hidden="true">
          <span
            className="story-spectrum-label story-spectrum-label--start"
            style={{ "--story-spectrum-icon": `url(${startIcon})` }}
          >
            <span className="story-spectrum-label-icon" aria-hidden="true" />
            <span className="story-spectrum-label-text">{startLabel}</span>
          </span>
          <div className="story-spectrum-track">
            <span className="story-spectrum-arrow story-spectrum-arrow--left" />
            <span className="story-spectrum-line" />
            <span className="story-spectrum-arrow story-spectrum-arrow--right" />
          </div>
          <span
            className="story-spectrum-label story-spectrum-label--end"
            style={{ "--story-spectrum-icon": `url(${endIcon})` }}
          >
            <span className="story-spectrum-label-icon" aria-hidden="true" />
            <span className="story-spectrum-label-text">{endLabel}</span>
          </span>
        </div>
        {items.length > 0 ? (
          <ul className="story-spectrum-grid" role="list">
            {items.map((item, index) => (
              <li
                key={item?.id || index}
                className={`story-spectrum-card story-spectrum-card--tone-${index + 1}${
                  item?.id === "architecture" ? " story-spectrum-card--featured" : ""
                }`}
              >
                {item?.name ? <h3 className="story-spectrum-card-title">{item.name}</h3> : null}
                {item?.description ? (
                  <p className="story-spectrum-card-description">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
