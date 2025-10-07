import { withBase } from "../../../utils/withBase.js";

export default function StoryTopBar({
  brand,
  canGoBack,
  canGoForward,
  onBack,
  onNext,
  onSelect,
  progressDots,
}) {
  return (
    <div className="story-top-bar">
      <div className="story-brand">
        {brand?.logo ? <img src={brand.logo} alt={brand.alt || "UWE Bristol"} className="story-brand-logo" /> : null}
        {brand?.label ? <span>{brand.label}</span> : null}
      </div>

      <div className="story-top-controls">
        <button type="button" className="btn secondary" onClick={onBack} disabled={!canGoBack}>
          Back
        </button>

        <div className="story-progress" role="tablist" aria-label="Story progress">
          {(progressDots || []).map((dot, index) => (
            <button
              key={dot.id || index}
              type="button"
              className={`story-progress-dot${dot.active ? " is-active" : ""}`}
              onClick={() => onSelect(index)}
              aria-label={`Go to scene ${index + 1}${dot.label ? `: ${dot.label}` : ""}`}
              aria-current={dot.active ? "step" : undefined}
              data-label={dot.label || `Scene ${index + 1}`}
            >
              <span />
            </button>
          ))}
        </div>

        <button type="button" className="btn" onClick={onNext} disabled={!canGoForward}>
          Next
        </button>
      </div>
    </div>
  );
}
