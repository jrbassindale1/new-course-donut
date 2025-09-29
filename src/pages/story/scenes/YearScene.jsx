import { useMemo } from "react";
import SceneHeading from "../components/SceneHeading.jsx";
import programmeInfo from "../../../data/programmeInfo.json";

export default function YearScene({ scene }) {
  const programmeOutcomes = useMemo(() => {
    if (!Array.isArray(scene?.outcomeCodes) || !Array.isArray(programmeInfo?.outcomes)) {
      return [];
    }
    return scene.outcomeCodes
      .map((code) => programmeInfo.outcomes.find((outcome) => outcome?.code === code))
      .filter(Boolean);
  }, [scene?.outcomeCodes]);

  return (
    <div className="story-scene story-scene--year">
      <SceneHeading scene={scene} />
      <div className="story-year-grid">
        {(scene?.tiles || []).map((tile) => {
          const themes = Array.isArray(tile?.themes)
            ? tile.themes.filter((theme) => Boolean(theme && String(theme).trim()))
            : [];
          const hasImage = Boolean(tile?.image);
          const hasThemes = themes.length > 0;

          return (
            <article key={tile.track} className="story-year-card">
              <header>
                <p className="story-journey-track">{tile.track}</p>
                {tile?.deliverable ? (
                  <p className="story-journey-deliverable">{tile.deliverable}</p>
                ) : null}
              </header>
              {hasImage || hasThemes ? (
                <div className="story-year-card-content">
                  {hasImage ? (
                    <div className="story-journey-image" style={{ backgroundImage: `url(${tile.image})` }} />
                  ) : null}
                  {hasThemes ? (
                    <ul className="story-year-themes" role="list">
                      {themes.map((theme) => (
                        <li key={theme}>{theme}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {programmeOutcomes.length ? (
        <div className="story-year-outcomes">
          <h3 className="story-year-outcomes-title">Programme outcomes highlighted this year</h3>
          <ul>
            {programmeOutcomes.map((outcome) => (
              <li key={outcome.code}>
                <span className="story-year-outcome-code">{outcome.code}</span>
                <span className="story-year-outcome-text">{outcome.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {scene?.footnote ? <p className="story-footnote">{scene.footnote}</p> : null}
    </div>
  );
}
