import { useCallback, useState } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import { withBase } from "../../../utils/withBase.js";

export default function CourseSpectrumScene({ scene }) {
  const startLabel = scene?.spectrum?.startLabel || "Creative";
  const endLabel = scene?.spectrum?.endLabel || "Technical";
  const items = Array.isArray(scene?.spectrum?.items) ? scene.spectrum.items : [];
  const startIcon = withBase("/images/icons/noun-creativity-7236902.svg");
  const endIcon = withBase("/images/icons/noun-construction-8105758.svg");
  const [expandedIds, setExpandedIds] = useState(() => new Set(["architecture"]));

  const handleToggle = useCallback((itemId) => {
    if (!itemId) return;
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

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
            {items.map((item, index) => {
              const id = item?.id || `course-${index}`;
              const isFeatured = item?.id === "architecture";
              const isExpanded = isFeatured || expandedIds.has(id);
              const canToggle = !isFeatured && !!item?.description;
              const descriptionId = `story-spectrum-card-description-${id}`;

              return (
                <li
                  key={id}
                  className={`story-spectrum-card story-spectrum-card--tone-${index + 1}${
                    isFeatured ? " story-spectrum-card--featured" : ""
                  }${isExpanded ? " is-expanded" : ""}`}
                >
                  <div className="story-spectrum-card-header">
                    {item?.name ? <h3 className="story-spectrum-card-title">{item.name}</h3> : null}
                    {canToggle ? (
                      <button
                        type="button"
                        className={`story-spectrum-card-toggle${isExpanded ? " is-open" : ""}`}
                        onClick={() => handleToggle(id)}
                        aria-expanded={isExpanded}
                        aria-controls={descriptionId}
                      >
                        <span className="sr-only">
                          {isExpanded
                            ? `Hide details for ${item?.name || "this course"}`
                            : `Show details for ${item?.name || "this course"}`}
                        </span>
                        <span className="story-spectrum-card-icon" aria-hidden="true">
                          <span />
                          <span />
                        </span>
                      </button>
                    ) : null}
                  </div>
                  {item?.description ? (
                    <p id={descriptionId} className="story-spectrum-card-description">
                      {item.description}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
