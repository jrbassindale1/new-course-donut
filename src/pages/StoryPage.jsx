import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CompassChart from "../components/CompassChart.jsx";
import moduleInfo from "../data/moduleInfo.json";
import programmeInfo from "../data/programmeInfo.json";
import storyScenes from "../data/storyScenes.json";
import uweLogo from "../assets/1280px-UWE_Bristol_logo.svg copy.jpg";

const SCENES = Array.isArray(storyScenes?.scenes) ? storyScenes.scenes : [];
const TOTAL_SCENES = SCENES.length;

let ytApiPromise;

function loadYouTubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (window.YT && typeof window.YT.Player === "function") {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load YouTube API"));
    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === "function") {
        try {
          previous();
        } catch (error) {
          // ignore
        }
      }
      resolve(window.YT);
    };
  });
  return ytApiPromise;
}

function getHashContext() {
  if (typeof window === "undefined") {
    return { path: "", params: new URLSearchParams() };
  }
  const hash = window.location.hash || "";
  const withoutHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path = "", search = ""] = withoutHash.split("?");
  return {
    path,
    params: new URLSearchParams(search),
  };
}

function getInitialIndex() {
  if (typeof window === "undefined") return 0;
  const { params } = getHashContext();
  const value = params.get("scene");
  if (value == null) return 0;
  const idx = Number.parseInt(value, 10);
  if (Number.isNaN(idx)) return 0;
  return Math.max(0, Math.min(TOTAL_SCENES - 1, idx));
}

function useShareMode() {
  if (typeof window === "undefined") {
    return false;
  }
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("share") === "1") {
    return true;
  }
  const { params } = getHashContext();
  return params.get("share") === "1";
}

function updateHash(index) {
  if (typeof window === "undefined") return;
  const { path, params } = getHashContext();
  params.set("scene", String(index));
  const query = params.toString();
  const nextHash = `#${path}${query ? `?${query}` : ""}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function SceneHeading({ scene }) {
  return (
    <header className="story-heading">
      <p className="story-label">{scene.label}</p>
      <h1 className="story-title">{scene.title}</h1>
      {scene.headline ? <p className="story-headline">{scene.headline}</p> : null}
    </header>
  );
}

function WelcomeScene({ scene }) {
  const [activeCard, setActiveCard] = useState(null);

  const handleCardToggle = useCallback((index) => {
    setActiveCard((prev) => (prev === index ? null : index));
  }, []);

  const handleCardEnter = useCallback((index) => {
    setActiveCard(index);
  }, []);

  const handleCardLeave = useCallback((index) => {
    setActiveCard((prev) => (prev === index ? null : prev));
  }, []);

  return (
    <div className="story-scene story-scene--welcome">
      <SceneHeading scene={scene} />
      <div className="story-welcome-hero">
        <aside className="story-hero-media" aria-hidden="true">
          <div
            className="story-hero-image"
            style={{ backgroundImage: `url(${scene?.background?.src || ""})` }}
          />
          <ul className="story-keywords">
            {(scene?.background?.keywords || []).map((keyword) => (
              <li key={keyword}>{keyword}</li>
            ))}
          </ul>
        </aside>
        <div className="story-welcome-content">
          {scene?.headline ? <p className="story-welcome-lede">{scene.headline}</p> : null}
          {Array.isArray(scene?.sections) && scene.sections.length > 0 ? (
            <ul className="story-welcome-grid" role="list">
              {scene.sections.map((section, index) => {
                const key = section?.title ? `${section.title}-${index}` : `section-${index}`;
                const isFlipped = activeCard === index;
                return (
                  <li key={key} className="story-welcome-card">
                    <button
                      type="button"
                      className={`story-welcome-card-toggle${isFlipped ? " is-active" : ""}`}
                      aria-pressed={isFlipped}
                      aria-label={`Read more about ${section?.title || "this highlight"}`}
                      onMouseEnter={() => handleCardEnter(index)}
                      onMouseLeave={() => handleCardLeave(index)}
                      onFocus={() => handleCardEnter(index)}
                      onBlur={() => handleCardLeave(index)}
                      onClick={() => handleCardToggle(index)}
                    >
                      <span className={`story-welcome-card-inner${isFlipped ? " is-flipped" : ""}`}>
                        <span className="story-welcome-card-face is-front">
                          {section?.title ? <h3>{section.title}</h3> : null}
                        </span>
                        <span className="story-welcome-card-face is-back">
                          {section?.copy ? <p>{section.copy}</p> : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {scene?.qr?.href || scene?.link?.href ? (
            <div className="story-welcome-meta">
              {scene?.qr?.href ? (
                <a className="story-qr" href={scene.qr.href} target="_blank" rel="noreferrer">
                  {scene.qr.label || "Share"}
                </a>
              ) : null}
              {scene?.link?.href ? (
                <a
                  className="story-welcome-link"
                  href={scene.link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {scene.link.label || "See full course details"}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function VideoScene({ scene }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        playerRef.current = new YT.Player(containerRef.current, {
          videoId: scene?.videoId || "",
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            fs: 0,
            playsinline: 1,
            showinfo: 0,
          },
          events: {
            onReady: () => {
              if (!cancelled) setIsReady(true);
            },
            onStateChange: (event) => {
              if (!event) return;
              const state = event.data;
              const PlayerState = window?.YT?.PlayerState;
              if (PlayerState && state === PlayerState.PLAYING) {
                setIsExpanded(true);
              } else if (PlayerState && (state === PlayerState.PAUSED || state === PlayerState.ENDED)) {
                setIsExpanded(false);
              }
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_err) {
          // ignore cleanup failures
        }
        playerRef.current = null;
      }
    };
  }, [scene?.videoId]);

  const handlePlay = useCallback(() => {
    playerRef.current?.playVideo();
    setIsExpanded(true);
    if (typeof window !== "undefined" && window.innerWidth <= 720) {
      const iframe = playerRef.current?.getIframe?.();
      try {
        if (iframe?.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe?.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }
    }
  }, []);

  const handleStop = useCallback(() => {
    playerRef.current?.stopVideo();
    setIsExpanded(false);
  }, []);

  const handlePause = useCallback(() => {
    playerRef.current?.pauseVideo();
    setIsExpanded(false);
  }, []);

  const status = error ? "Video failed to load" : isReady ? null : "Loading video";

  return (
    <div className={`story-scene story-scene--video${isExpanded ? " is-playing" : ""}`}>
      <SceneHeading scene={scene} />
      <div className="story-video-frame" aria-label="Programme introduction video">
        <div ref={containerRef} className="story-video-player" />
      </div>
      <div className="story-video-actions">
        <button type="button" className="btn" onClick={handlePlay} disabled={!isReady || !!error}>
          Play
        </button>
        <button type="button" className="btn secondary" onClick={handlePause} disabled={!isReady || !!error}>
          Pause
        </button>
        <button type="button" className="btn secondary" onClick={handleStop} disabled={!isReady || !!error}>
          Stop
        </button>
        {status ? <span className="story-video-status">{status}</span> : null}
      </div>
    </div>
  );
}

function BristolScene({ scene }) {
  return (
    <div className="story-scene story-scene--bristol">
      <SceneHeading scene={scene} />
      <div className="story-bristol-grid">
        {(scene?.sections || []).map((section) => (
          <article key={section.title} className="story-bristol-card">
            <h3>{section.title}</h3>
            <p>{section.copy}</p>
          </article>
        ))}
      </div>
      {scene?.link?.href ? (
        <a className="btn secondary" href={scene.link.href} target="_blank" rel="noreferrer">
          {scene.link.label || "Discover Bristol"}
        </a>
      ) : null}
    </div>
  );
}

function StudioScene({ scene }) {
  return (
    <div className="story-scene story-scene--studio">
      <SceneHeading scene={scene} />
      <div className="story-studio-grid">
        {(scene?.pins || []).map((pin) => (
          <div key={pin.id} className="story-pin-card">
            <div className="story-pin-media" aria-hidden="true">
              <div className="story-pin-thumb" style={{ backgroundImage: `url(${pin.fallback || ""})` }} />
            </div>
            <div className="story-pin-body">
              <h3>{pin.title}</h3>
              <p>{pin.caption}</p>
              <p className="story-pin-meta">
                <span className="story-pin-type">Loop / Still</span>
                <span className="story-pin-src">{pin.media || "TBC"}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCreditsFromModule(module) {
  const creditEntry = Array.isArray(module?.keyInfo)
    ? module.keyInfo.find((item) => item?.label?.toLowerCase() === "credits" && item?.value)
    : null;
  if (!creditEntry) return null;
  const numeric = Number.parseInt(String(creditEntry.value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatModuleKeyInfo(module) {
  if (!Array.isArray(module?.keyInfo)) return [];
  return module.keyInfo
    .filter((item) => item?.label && item?.value)
    .map((item) => `${item.label}: ${item.value}`);
}

function leadSentence(text) {
  if (!text) return "";
  const trimmed = String(text).trim();
  const match = trimmed.match(/^(.+?[.!?])(?=\s|$)/);
  return match ? match[1] : trimmed;
}

function cleanOutcome(outcome) {
  if (!outcome) return "";
  return String(outcome).replace(/^MO\d+\s*/i, "").trim();
}

function YearScene({ scene }) {
  const year = scene?.year ? String(scene.year) : null;

  const modulesForYear = useMemo(() => {
    if (!year) return [];
    return Object.values(moduleInfo).filter((module) => module?.["year of study"] === year);
  }, [year]);

  const modulesByTheme = useMemo(() => {
    const map = new Map();
    modulesForYear.forEach((module) => {
      const theme = module?.moduleTheme || "Other";
      const list = map.get(theme) || [];
      list.push(module);
      map.set(theme, list);
    });
    return map;
  }, [modulesForYear]);

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
          const themes = Array.isArray(tile?.themes) && tile.themes.length > 0 ? tile.themes : [];
          const tileModules = (() => {
            if (!themes.length) return modulesForYear;
            const collected = new Map();
            themes.forEach((theme) => {
              const matches = modulesByTheme.get(theme) || [];
              matches.forEach((module) => {
                if (!collected.has(module.id)) {
                  collected.set(module.id, module);
                }
              });
            });
            return Array.from(collected.values());
          })();

          const totalCredits = tileModules.reduce((sum, module) => {
            const credits = getCreditsFromModule(module);
            return sum + (credits || 0);
          }, 0);

          return (
            <article key={tile.track} className="story-year-card">
              <header>
                <p className="story-journey-track">{tile.track}</p>
                <p className="story-journey-deliverable">
                  {tile.deliverable}
                  {totalCredits ? ` • ${totalCredits} credits` : ""}
                </p>
              </header>
              <div className="story-year-card-content">
                <ul className="story-year-modules">
                  {tileModules.length === 0 ? (
                    <li className="story-year-module">Module information coming soon.</li>
                  ) : (
                    tileModules.map((module) => {
                      const keyInfo = formatModuleKeyInfo(module);
                      const synopsis = leadSentence(module?.synopsis);
                      const outcomes = Array.isArray(module?.outcomes)
                        ? module.outcomes.slice(0, 2).map(cleanOutcome).filter(Boolean)
                        : [];

                      return (
                        <li key={module.id} className="story-year-module">
                          <p className="story-year-module-code">{module.id}</p>
                          <h3 className="story-year-module-name">{module.moduleName}</h3>
                          {keyInfo.length ? (
                            <p className="story-year-module-meta">{keyInfo.join(" • ")}</p>
                          ) : null}
                          {synopsis ? <p className="story-year-module-synopsis">{synopsis}</p> : null}
                          {outcomes.length ? (
                            <ul className="story-year-module-outcomes">
                              {outcomes.map((outcome) => (
                                <li key={outcome}>{outcome}</li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      );
                    })
                  )}
                </ul>
                {tile.image ? (
                  <div className="story-journey-image" style={{ backgroundImage: `url(${tile.image})` }} />
                ) : null}
              </div>
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
      {scene.footnote ? <p className="story-footnote">{scene.footnote}</p> : null}
    </div>
  );
}

function ChartScene({ scene, onOpenFullChart }) {
  const [selected, setSelected] = useState({ moduleId: null, key: null });

  const detail = useMemo(() => {
    const { moduleId, key } = selected;
    if (!moduleId || !key) {
      return {
        title: "Explore the layers",
        body: [
          "Highlight any segment on the chart to see how design, technology and practice strands stack across the three years.",
        ],
      };
    }

    const isProgramme = moduleId === "PROGRAMME";
    const source = isProgramme ? programmeInfo : moduleInfo[moduleId] || {};
    const raw = source?.[key];

    const titleLeft = isProgramme
      ? "Programme"
      : (moduleInfo[moduleId] && moduleInfo[moduleId].moduleName) || moduleId;

    const sectionLabel = (() => {
      if (key === "threads") return "Studio Threads";
      if (key === "outcomes") return isProgramme ? "Outcomes" : "Module Outcomes";
      const labels = {
        keyInfo: "Key Info",
        synopsis: "Synopsis",
        learningAndTeaching: "Learning & Teaching",
        supportAndFacilities: "Support & Facilities",
        professionalRecognition: "Professional Recognition",
      };
      return labels[key] || key;
    })();

    const toParagraphs = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "string" ? item : item?.value || item?.text || ""))
          .filter(Boolean);
      }
      const stringValue = String(value);
      return stringValue.split(/\n\s*\n/).filter(Boolean);
    };

    const body = toParagraphs(raw);

    if (key === "threads" && Array.isArray(raw)) {
      return {
        title: `${titleLeft} — ${sectionLabel}`,
        body: raw
          .map((thread) => {
            if (!thread) return null;
            if (typeof thread === "string") return thread;
            const parts = [];
            if (thread.title) parts.push(thread.title);
            if (thread.keywords) parts.push(`(${thread.keywords})`);
            if (thread.description) parts.push(thread.description);
            return parts.filter(Boolean).join(" — ");
          })
          .filter(Boolean),
      };
    }

    return {
      title: `${titleLeft} — ${sectionLabel}`,
      body: body.length
        ? body
        : ["Details coming soon. Select another area to keep exploring."],
    };
  }, [selected]);

  return (
    <div className="story-scene story-scene--chart">
      <SceneHeading scene={scene} />
      <div className="story-chart">
        <div className="story-chart-canvas">
          <CompassChart
            width={480}
            height={480}
            onInfoSelect={(moduleId, key) => setSelected({ moduleId, key })}
          />
        </div>
        <aside className="story-chart-detail">
          <h2>{detail.title}</h2>
          {detail.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {scene?.cta?.href ? (
            <button
              type="button"
              className="btn secondary"
              onClick={() => onOpenFullChart && onOpenFullChart()}
            >
              {scene.cta.label || "Open full chart view"}
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function LeadersScene({ scene }) {
  return (
    <div className="story-scene story-scene--leaders">
      <SceneHeading scene={scene} />
      <div className="story-leaders-grid">
        {(scene?.leaders || []).map((leader) => (
          <article key={leader.id} className="story-leader-card">
            <div className="story-leader-photo" style={{ backgroundImage: `url(${leader.image || ""})` }} />
            <div className="story-leader-body">
              <h3>{leader.name}</h3>
              <p className="story-leader-role">{leader.role}</p>
              <p>{leader.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function DestinationsScene({ scene }) {
  const companies = scene?.companies || [];
  const reduceMotion = usePrefersReducedMotion();
  const gridItems = useMemo(() => {
    if (!companies.length) return [];
    const total = 10;
    const items = [];
    for (let i = 0; i < total; i += 1) {
      const company = companies[i % companies.length];
      items.push({ ...company, gridIndex: i });
    }
    return items;
  }, [companies]);

  const [flippedState, setFlippedState] = useState(() => gridItems.map(() => false));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    setFlippedState(gridItems.map(() => false));
    setHoveredIndex(null);
  }, [gridItems]);

  useEffect(() => {
    if (reduceMotion || !gridItems.length) return undefined;
    const intervalId = window.setInterval(() => {
      setFlippedState((prev) => {
        if (!prev.length) return prev;
        const next = prev.slice();
        const randomIndex = Math.floor(Math.random() * next.length);
        next[randomIndex] = !next[randomIndex];
        return next;
      });
    }, 3600);
    return () => window.clearInterval(intervalId);
  }, [gridItems.length, reduceMotion]);

  return (
    <div className="story-scene story-scene--destinations">
      <SceneHeading scene={scene} />
      <div className="story-destinations-grid" aria-label="Graduate destinations grid">
        {gridItems.map((company, index) => {
          const isFlipped = (flippedState[index] && !reduceMotion) || hoveredIndex === index;
          return (
            <button
              key={`${company.id}-${index}`}
              type="button"
              className={`story-destination-cell${isFlipped ? " is-flipped" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
            >
              <div className="story-destination-inner">
                <div className="story-destination-face story-destination-front">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="story-destination-logo" />
                  ) : (
                    <span className="story-destination-text">{company.name}</span>
                  )}
                </div>
                <div className="story-destination-face story-destination-back">
                  {company.image ? (
                    <img
                      src={company.image}
                      alt={company.alt || company.name}
                      className="story-destination-photo"
                    />
                  ) : null}
                  <div className="story-destination-backdrop" />
                  <div className="story-destination-back-meta">
                    <span className="story-destination-name">{company.name}</span>
                    {company.link ? (
                      <a
                        className="story-destination-link"
                        href={company.link}
                        target="_blank"
                        rel="noreferrer"
                        tabIndex={-1}
                      >
                        Visit site
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProjectsScene({ scene }) {
  return (
    <div className="story-scene story-scene--projects">
      <SceneHeading scene={scene} />
      <div className="story-projects-grid">
        {(scene?.tiles || []).map((tile) => (
          <button key={tile.id} type="button" className="story-project-card">
            <div className="story-project-media" style={{ backgroundImage: `url(${tile.image || ""})` }} />
            <div className="story-project-overlay">
              <h3>{tile.title}</h3>
              <p>{tile.caption}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function GlobalScene({ scene }) {
  return (
    <div className="story-scene story-scene--global">
      <SceneHeading scene={scene} />
      <div className="story-global-carousel">
        {(scene?.partners || []).map((partner) => (
          <div key={partner.id} className="story-global-card">
            <div className="story-global-image" style={{ backgroundImage: `url(${partner.image || ""})` }} />
            <div className="story-global-body">
              <h3>{partner.institution}</h3>
              <p>{partner.summary}</p>
            </div>
          </div>
        ))}
      </div>
      {scene.eligibilityNote ? <p className="story-footnote">{scene.eligibilityNote}</p> : null}
    </div>
  );
}

function OutcomesScene({ scene }) {
  return (
    <div className="story-scene story-scene--outcomes">
      <SceneHeading scene={scene} />
      <div className="story-outcome-cards">
        {(scene?.stats || []).map((stat) => (
          <article key={stat.id} className="story-outcome-card">
            <p className="story-outcome-value">{stat.value}</p>
            <p className="story-outcome-metric">{stat.metric}</p>
            <p className="story-outcome-source">{stat.source}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function PathwayScene({ scene }) {
  return (
    <div className="story-scene story-scene--pathway">
      <SceneHeading scene={scene} />
      <div className="story-pathway">
        {(scene?.steps || []).map((step, index) => (
          <div key={step} className="story-pathway-step">
            <div className="story-pathway-node">
              <span>{index + 1}</span>
            </div>
            <p>{step}</p>
          </div>
        ))}
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

function ContactScene({ scene }) {
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

function SceneRenderer({ scene, onOpenFullChart }) {
  switch (scene.id) {
    case "video":
      return <VideoScene scene={scene} />;
    case "leaders":
      return <LeadersScene scene={scene} />;
    case "welcome":
      return <WelcomeScene scene={scene} />;
    case "bristol":
      return <BristolScene scene={scene} />;
    case "year1":
    case "year2":
    case "year3":
      return <YearScene scene={scene} />;
    case "destinations":
      return <DestinationsScene scene={scene} />;
    case "studio":
      return <StudioScene scene={scene} />;
    case "chart":
      return <ChartScene scene={scene} onOpenFullChart={onOpenFullChart} />;
    case "projects":
      return <ProjectsScene scene={scene} />;
    case "global":
      return <GlobalScene scene={scene} />;
    case "outcomes":
      return <OutcomesScene scene={scene} />;
    case "pathway":
      return <PathwayScene scene={scene} />;
    case "contact":
      return <ContactScene scene={scene} />;
    default:
      return (
        <div className="story-scene">
          <SceneHeading scene={scene} />
          <p>Scene template coming soon.</p>
        </div>
      );
  }
}

export default function StoryPage({ onNavigate }) {
  const [index, setIndex] = useState(() => getInitialIndex());
  const isShareMode = useShareMode();
  const scene = SCENES[index] || null;
  const [bridgeActive, setBridgeActive] = useState(false);
  const bridgeTimerRef = useRef(null);

  const clearBridgeTimer = useCallback(() => {
    if (bridgeTimerRef.current) {
      window.clearTimeout(bridgeTimerRef.current);
      bridgeTimerRef.current = null;
    }
  }, []);

  const scheduleBridge = useCallback(
    (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= TOTAL_SCENES) {
        clearBridgeTimer();
        setBridgeActive(false);
        return;
      }
      const currentId = SCENES[index]?.id;
      const nextId = SCENES[nextIndex]?.id;
      const shouldBridge = currentId === "video" && nextId === "leaders";
      clearBridgeTimer();
      if (shouldBridge) {
        setBridgeActive(true);
        bridgeTimerRef.current = window.setTimeout(() => {
          setBridgeActive(false);
          bridgeTimerRef.current = null;
        }, 600);
      } else {
        setBridgeActive(false);
      }
    },
    [clearBridgeTimer, index]
  );

  const handleNext = useCallback(() => {
    setIndex((current) => {
      const nextIndex = Math.min(TOTAL_SCENES - 1, current + 1);
      if (nextIndex !== current) {
        scheduleBridge(nextIndex);
      }
      return nextIndex;
    });
  }, [scheduleBridge]);

  const handlePrev = useCallback(() => {
    setIndex((current) => {
      const nextIndex = Math.max(0, current - 1);
      if (nextIndex !== current) {
        scheduleBridge(nextIndex);
      }
      return nextIndex;
    });
  }, [scheduleBridge]);

  const handleSelect = useCallback((idx) => {
    const bounded = Math.max(0, Math.min(TOTAL_SCENES - 1, idx));
    scheduleBridge(bounded);
    setIndex(bounded);
  }, [scheduleBridge]);

  useEffect(() => {
    if (!scene) return;
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      updateHash(index);
    }
  }, [index, scene]);

  useEffect(() => () => {
    clearBridgeTimer();
  }, [clearBridgeTimer]);

  useEffect(() => {
    const listener = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowRight" || event.key === "n" || event.key === "N") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowLeft" || event.key === "b" || event.key === "B") {
        event.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [handleNext, handlePrev]);

  const progressDots = useMemo(() => {
    return SCENES.map((item, idx) => ({
      id: item.id,
      label: item.label,
      active: idx === index,
    }));
  }, [index]);

  if (!scene) {
    return (
      <div className="story-page">
        <div className="story-stage">
          <p>Scene data missing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`story-page${isShareMode ? " story-page--share" : ""}`}>
        <div className="story-top-bar">
          <div className="story-brand">
            <img src={uweLogo} alt="UWE Bristol" className="story-brand-logo" />
            <span>BSc Architecture</span>
          </div>
        <div className="story-top-controls">
          <button type="button" className="btn secondary" onClick={handlePrev} disabled={index === 0}>
            Back
          </button>
          <div className="story-progress" role="tablist" aria-label="Story progress">
            {progressDots.map((dot, idx) => (
              <button
                key={dot.id}
                type="button"
                className={`story-progress-dot${dot.active ? " is-active" : ""}`}
                onClick={() => handleSelect(idx)}
                aria-label={`Go to scene ${idx + 1}: ${dot.label}`}
                aria-current={dot.active ? "step" : undefined}
                data-label={dot.label}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn"
            onClick={handleNext}
            disabled={index === TOTAL_SCENES - 1}
          >
            Next
          </button>
        </div>
      </div>

      <div
        className={`story-stage${bridgeActive ? " bridge-active" : ""}`}
        role="group"
        aria-roledescription="Slide"
        aria-label={scene.label}
      >
        <SceneRenderer
          scene={scene}
          onOpenFullChart={onNavigate ? () => onNavigate("chart") : undefined}
        />
      </div>

    </div>
  );
}
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return prefersReducedMotion;
}
