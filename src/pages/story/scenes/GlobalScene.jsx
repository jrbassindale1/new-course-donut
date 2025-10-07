import { useCallback, useMemo, useState, useEffect } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import europeMapImage from "../../../../images/story/europe.svg?url";
import { withBase } from "../../../utils/withBase.js";

const EUROPE_MAP_BOUNDS = Object.freeze({
  minLat: 33,
  maxLat: 72,
  minLon: -12,
  maxLon: 33,
});

const EUROPE_SVG_FRAME = Object.freeze({
  left: 0.0458,
  top: -0.0383,
  width: 0.7254,
  height: 0.8503,
});

const EUROPE_MAP_OFFSET = Object.freeze({
  x: -0.072,
  y: 0.056,
});

function projectToMap(latitude, longitude) {
  const { minLat, maxLat, minLon, maxLon } = EUROPE_MAP_BOUNDS;
  const clampLat = Number.isFinite(latitude) ? Math.min(Math.max(latitude, minLat), maxLat) : (minLat + maxLat) / 2;
  const clampLon = Number.isFinite(longitude) ? Math.min(Math.max(longitude, minLon), maxLon) : (minLon + maxLon) / 2;
  const normalizedX = (clampLon - minLon) / (maxLon - minLon);
  const normalizedY = 1 - (clampLat - minLat) / (maxLat - minLat);
  const left = EUROPE_SVG_FRAME.left + EUROPE_SVG_FRAME.width * normalizedX + EUROPE_MAP_OFFSET.x;
  const top = EUROPE_SVG_FRAME.top + EUROPE_SVG_FRAME.height * normalizedY + EUROPE_MAP_OFFSET.y;
  const clampedLeft = Math.min(Math.max(left, 0), 1);
  const clampedTop = Math.min(Math.max(top, 0), 1);
  return { left: `${clampedLeft * 100}%`, top: `${clampedTop * 100}%` };
}

function EuropeMapVisual() {
  return <img className="story-global-europe" src={europeMapImage} alt="" loading="lazy" />;
}

export default function GlobalScene({ scene }) {
  const partners = useMemo(
    () => (Array.isArray(scene?.partners) ? scene.partners : []),
    [scene],
  );
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const activePartner = useMemo(
    () => partners.find((partner) => partner.id === activeId) || null,
    [partners, activeId],
  );

  const resolvedActiveImage = useMemo(() => (activePartner?.image ? withBase(activePartner.image) : ""), [activePartner]);

  useEffect(() => {
    if (!activePartner) return;
    // Debug: see exactly which URL the browser will request
    /* eslint-disable no-console */
    console.log("[GlobalScene] activePartner image →", resolvedActiveImage);
  }, [activePartner, resolvedActiveImage]);

  const highlightedId = hoverId != null ? hoverId : activeId;

  const handleHighlight = useCallback((partnerId) => {
    setHoverId(partnerId);
  }, []);

  const handleClearHighlight = useCallback(() => {
    setHoverId(null);
  }, []);

  const handleSelect = useCallback((partnerId) => {
    setActiveId(partnerId);
    setHoverId(partnerId);
  }, []);

  const handleBackToList = useCallback(() => {
    setActiveId(null);
    setHoverId(null);
  }, []);

  const getPartnerPosition = useCallback((partner) => {
    if (Number.isFinite(partner.mapX) && Number.isFinite(partner.mapY)) {
      return { left: `${partner.mapX}%`, top: `${partner.mapY}%` };
    }
    return projectToMap(partner.latitude, partner.longitude);
  }, []);

  return (
    <div className="story-scene story-scene--global">
      <SceneHeading scene={scene} />
      <div className="story-global-layout">
        <div className="story-global-map" onMouseLeave={handleClearHighlight}>
          <div className="story-global-map-contents">
            <EuropeMapVisual />
            <ul className="story-global-pins" role="list">
              {partners.map((partner) => {
                const hasLatLon = Number.isFinite(partner.latitude) && Number.isFinite(partner.longitude);
                const hasMapPosition = Number.isFinite(partner.mapX) && Number.isFinite(partner.mapY);
                if (!hasLatLon && !hasMapPosition) {
                  return null;
                }
                const position = getPartnerPosition(partner);
                const isSelected = activeId === partner.id;
                const isHighlighted = highlightedId === partner.id;
                return (
                  <li
                    key={partner.id}
                    className={`story-global-pin${isSelected ? " is-active" : ""}${
                      isHighlighted ? " is-highlighted" : ""
                    }`}
                    style={position}
                    onMouseLeave={handleClearHighlight}
                  >
                    <button
                      type="button"
                      className="story-global-pin-button"
                      aria-pressed={isSelected}
                      aria-label={`${partner.institution}${partner.city ? `, ${partner.city}` : ""}`}
                      onMouseEnter={() => handleHighlight(partner.id)}
                      onFocus={() => handleHighlight(partner.id)}
                      onClick={() => handleSelect(partner.id)}
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          handleClearHighlight();
                        }
                      }}
                    />
                    {isHighlighted ? (
                      <div className="story-global-tooltip" role="status">
                        {partner.city ? <p className="story-global-tooltip-label">{partner.city}</p> : null}
                        <p className="story-global-tooltip-title">{partner.institution}</p>
                        {partner.duration ? (
                          <p className="story-global-tooltip-detail">{partner.duration}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <aside className={`story-global-info${activePartner ? " is-detail" : ""}`}>
          {activePartner ? (
            <div className="story-global-info-detail">
              <button type="button" className="story-global-info-back" onClick={handleBackToList}>
                Back to partners
              </button>
              <div
                className="story-global-info-image"
                style={{ backgroundImage: `url(${resolvedActiveImage})` }}
              />
              <div className="story-global-info-body">
                <h3>{activePartner.institution}</h3>
                {activePartner.city ? (
                  <p className="story-global-info-location">{activePartner.city}</p>
                ) : null}
                {activePartner.summary ? (
                  <p className="story-global-info-summary">{activePartner.summary}</p>
                ) : null}
                {activePartner.duration ? (
                  <p className="story-global-info-duration">{activePartner.duration}</p>
                ) : null}
                {activePartner.link ? (
                  <a
                    className="story-global-info-link"
                    href={activePartner.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Find out more (External Website)
                  </a>
                ) : null}
                {Array.isArray(activePartner.programmes) && activePartner.programmes.length ? (
                  <div className="story-global-info-programmes">
                    <span className="story-global-info-programmes-label">Programmes</span>
                    <ul>
                      {activePartner.programmes.map((programme) => (
                        <li key={programme}>{programme}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="story-global-info-list">
              <h3 className="story-global-info-list-heading">Global exchange partners</h3>
              <ul>
                {partners.map((partner) => {
                  const isHovered = highlightedId === partner.id;
                  const isSelected = activeId === partner.id;
                  return (
                    <li key={partner.id}>
                      <button
                        type="button"
                        className={`story-global-info-list-button${isHovered ? " is-hovered" : ""}${
                          isSelected ? " is-selected" : ""
                        }`}
                        onMouseEnter={() => handleHighlight(partner.id)}
                        onMouseLeave={handleClearHighlight}
                        onFocus={() => handleHighlight(partner.id)}
                        onBlur={handleClearHighlight}
                        onClick={() => handleSelect(partner.id)}
                      >
                        <span className="story-global-info-list-name">{partner.institution}</span>
                        {partner.city ? (
                          <span className="story-global-info-list-location">{partner.city}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
      {scene?.eligibilityNote ? <p className="story-footnote">{scene.eligibilityNote}</p> : null}
    </div>
  );
}
