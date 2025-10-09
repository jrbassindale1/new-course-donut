import { useEffect, useRef, useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuItems = Array.isArray(progressDots) ? progressDots : [];
  const activeIndex = menuItems.findIndex((dot) => dot.active);
  const activeLabel =
    activeIndex >= 0 ? menuItems[activeIndex]?.label || `Scene ${activeIndex + 1}` : "Scene list";

  const resolveBrandLogo = (value) => {
    if (!value) return null;
    if (typeof value !== "string") return value;

    const isAbsoluteUrl = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value);
    if (isAbsoluteUrl || value.startsWith("data:") || value.startsWith("/")) {
      return value;
    }

    return withBase(value);
  };

  const brandLogo = resolveBrandLogo(brand?.logo);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleMenuToggle = () => setIsMenuOpen((prev) => !prev);

  const blurCurrentTarget = (event) => {
    if (event?.currentTarget && typeof event.currentTarget.blur === "function") {
      event.currentTarget.blur();
    }
  };

  const handleBackClick = (event) => {
    blurCurrentTarget(event);
    onBack();
  };

  const handleNextClick = (event) => {
    blurCurrentTarget(event);
    onNext();
  };

  const handleMenuSelect = (targetIndex) => {
    onSelect(targetIndex);
    setIsMenuOpen(false);
  };

  return (
    <div className="story-top-bar">
      <div className="story-brand">
        {brandLogo ? (
          <img src={brandLogo} alt={brand.alt || "UWE Bristol"} className="story-brand-logo" />
        ) : null}
        {brand?.label ? <span>{brand.label}</span> : null}
      </div>

      <div className="story-top-controls">
        <button type="button" className="btn secondary" onClick={handleBackClick} disabled={!canGoBack}>
          Back
        </button>

        <div className="story-mobile-menu" ref={menuRef}>
          <button
            type="button"
            className="story-mobile-menu-toggle"
            onClick={handleMenuToggle}
            aria-haspopup="true"
            aria-expanded={isMenuOpen}
            aria-controls="story-mobile-menu-options"
            aria-label={activeLabel ? `Select story scene (current: ${activeLabel})` : "Select story scene"}
            onPointerUp={blurCurrentTarget}
          >
            <span className="story-mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <div
            id="story-mobile-menu-options"
            className={`story-mobile-menu-dropdown${isMenuOpen ? " is-open" : ""}`}
            role="menu"
            aria-hidden={!isMenuOpen}
          >
            <ul className="story-mobile-menu-list">
              {menuItems.map((dot, index) => (
                <li key={dot.id || index}>
                  <button
                    type="button"
                    className={`story-mobile-menu-item${dot.active ? " is-active" : ""}`}
                    onClick={(event) => {
                      blurCurrentTarget(event);
                      handleMenuSelect(index);
                    }}
                    role="menuitem"
                  >
                    <span className="story-mobile-menu-item-label">
                      {dot.label || `Scene ${index + 1}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button type="button" className="btn" onClick={handleNextClick} disabled={!canGoForward}>
          Next
        </button>
      </div>
    </div>
  );
}
