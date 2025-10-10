import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import uweLogo from "../assets/uwe-bristol-logo.jpg";

const KEYWORDS = [
  "Transforming Futures",
  "Outstanding Learning",
  "Enterprising Culture",
  "Inclusive Learning",
  "Sustainability Focused",
  "Digitally Able",
  "Local and Regional Impact",
  "Opportunity to Thrive",
  "Global Reach",
];

const MAX_VISIBLE = 3; // show at most 3 floating words

const TICK_MS = 150;        // smooth updates
const MIN_LIFE = 60;        // ~7.2s at 120ms tick
const MAX_LIFE = 110;       // ~13.2s
const FADE_IN_MS = 1400;    // quicker fade-in so text becomes readable
const FADE_OUT_MS = 5000;   // slower fade-out for graceful exit

const randomInRange = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function estimateRadius(word) {
  const base = 7 + Math.min(42, word.text.length * 0.55); // account for longer words
  const padding = 12; // extra buffer so words don't feel cramped
  return base * word.scale + padding;
}

function isInsideExclusionPct(topPct, leftPct, radiusPct, exclusion) {
  if (!exclusion || !exclusion.zones?.length) return false;
  const { zones, cw, ch } = exclusion;
  if (!cw || !ch) return false;
  const x = (leftPct / 100) * cw;
  const y = (topPct / 100) * ch;
  const rpx = (radiusPct / 100) * Math.min(cw, ch);
  return zones.some(({ x0, y0, x1, y1 }) => {
    const inX = x > x0 - rpx && x < x1 + rpx;
    const inY = y > y0 - rpx && y < y1 + rpx;
    return inX && inY;
  });
}

function pushWordOutOfZone(word, zone, cw, ch) {
  const { x0, y0, x1, y1 } = zone;
  const x = (word.left / 100) * cw;
  const y = (word.top / 100) * ch;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = estimateRadius(word);
  // Rectangle inflate by r in px
  const rx0 = x0 - r;
  const ry0 = y0 - r;
  const rx1 = x1 + r;
  const ry1 = y1 + r;
  const inside = (x > rx0 && x < rx1 && y > ry0 && y < ry1);
  if (!inside) return word;
  // Move the point to the edge of the inflated rect plus a small padding
  const targetX = x < cx ? rx0 - 6 : rx1 + 6;
  const targetY = y < cy ? ry0 - 6 : ry1 + 6;
  // Project along the dominant axis
  const nx = Math.abs(dx) > Math.abs(dy) ? targetX : x;
  const ny = Math.abs(dx) > Math.abs(dy) ? y : targetY;
  const leftPct = clamp((nx / cw) * 100, 0, 100);
  const topPct  = clamp((ny / ch) * 100, 0, 100);
  return { ...word, left: leftPct, top: topPct };
}

function pushOutOfExclusion(word, exclusion) {
  if (!exclusion || !exclusion.zones?.length) return word;
  const { zones, cw, ch } = exclusion;
  if (!cw || !ch) return word;
  let adjusted = word;
  for (const zone of zones) {
    adjusted = pushWordOutOfZone(adjusted, zone, cw, ch);
  }
  return adjusted;
}


// Rectangle-based sizing & collision helpers
function getSizePct(word, exclusion) {
  // Return approximate width/height in % of container (x uses cw, y uses ch)
  if (!exclusion) return { wp: 0, hp: 0 };
  const { cw, ch } = exclusion;
  if (word.locked && word.w != null && word.h != null) {
    const wp = (word.w / cw) * 100;
    const hp = (word.h / ch) * 100;
    return { wp, hp };
    }
  // Fallback estimate before lock: crude width from chars, height from a line
  const avgChar = 8; // px per char baseline
  const lineH = 18;  // px per line baseline
  const estWpx = Math.min(cw * 0.5, (avgChar * word.text.length + 18) * (word.scale || 1));
  const estHpx = (lineH + 6) * (word.scale || 1);
  return { wp: (estWpx / cw) * 100, hp: (estHpx / ch) * 100 };
}

function rectFor(word, exclusion) {
  // Compute rectangle in % coords [x0,y0,x1,y1] centered at left/top
  const { wp, hp } = getSizePct(word, exclusion);
  const halfW = wp / 2;
  const halfH = hp / 2;
  return {
    x0: word.left - halfW,
    y0: word.top - halfH,
    x1: word.left + halfW,
    y1: word.top + halfH,
    halfW,
    halfH,
  };
}

function overlapRect(a, b) {
  // Return minimal axis overlap (ox, oy). Positive values = overlap amount.
  const ox = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const oy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  return { ox, oy };
}

function clampWordWithinBounds(word, exclusion) {
  if (!exclusion) return word;
  const rect = rectFor(word, exclusion);
  const minX = 8;
  const maxX = 92;
  const minY = 18;
  const maxY = 88;
  const boundedLeft = clamp(word.left, minX + rect.halfW, maxX - rect.halfW);
  const boundedTop = clamp(word.top, minY + rect.halfH, maxY - rect.halfH);
  if (boundedLeft === word.left && boundedTop === word.top) {
    return word;
  }
  return { ...word, left: boundedLeft, top: boundedTop };
}

function separateWords(words, exclusion) {
  if (!exclusion) return words;
  const MAX_ITERS = 12;
  for (let it = 0; it < MAX_ITERS; it++) {
    let movedAny = false;
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const a = words[i];
        const b = words[j];
        const ra = rectFor(a, exclusion);
        const rb = rectFor(b, exclusion);
        const sizeScale = Math.max(ra.halfW, rb.halfW, ra.halfH, rb.halfH);
        const margin = Math.max(1.1, Math.min(5.5, sizeScale * 0.35));
        // Inflate rectangles to reduce visual cramping
        const ai = { x0: ra.x0 - margin, y0: ra.y0 - margin, x1: ra.x1 + margin, y1: ra.y1 + margin };
        const bi = { x0: rb.x0 - margin, y0: rb.y0 - margin, x1: rb.x1 + margin, y1: rb.y1 + margin };
        const { ox, oy } = overlapRect(ai, bi);
        if (ox > 0 && oy > 0) {
          // Move along the axis of least separation
          if (ox < oy) {
            const push = (ox / 2) + Math.min(0.85, margin * 0.15);
            a.left -= push;
            b.left += push;
          } else {
            const push = (oy / 2) + Math.min(0.85, margin * 0.15);
            a.top  -= push;
            b.top  += push;
          }
          movedAny = true;
          // Clamp to bounds using rectangle half-sizes
          const aRect = rectFor(a, exclusion);
          const bRect = rectFor(b, exclusion);
          const minX = 8; const maxX = 92; const minY = 8; const maxY = 92;
          a.left = clamp(a.left, minX + aRect.halfW, maxX - aRect.halfW);
          a.top  = clamp(a.top,  minY + aRect.halfH, maxY - aRect.halfH);
          b.left = clamp(b.left, minX + bRect.halfW, maxX - bRect.halfW);
          b.top  = clamp(b.top,  minY + bRect.halfH, maxY - bRect.halfH);
        }
      }
    }
    if (!movedAny) break;
  }
  return words;
}

function makeWord(text, id, exclusion, existingWords = []) {
  let top = 50;
  let left = 50;
  let scale = 1;
  let attempts = 0;
  do {
    top = randomInRange(26, 84);
    left = randomInRange(18, 82);
    scale = randomInRange(0.85, 1.55);
    attempts++;
    if (!exclusion) {
      break;
    }
    // convert approximate radius to percentage of container's smaller side
    const dummy = { text, scale };
    const rpx = estimateRadius(dummy);
    // assume a 1000px reference to map px→% conservatively if exclusion unknown
    const ref = 1000;
    const rPct = (rpx / ref) * 100;
    if (isInsideExclusionPct(top, left, rPct, exclusion)) {
      continue;
    }
    const candidate = { text, top, left, scale, locked: false, w: null, h: null };
    const candidateRect = rectFor(candidate, exclusion);
    const overlapsExisting = existingWords.some((word) => {
      const rb = rectFor(word, exclusion);
      const sizeScale = Math.max(candidateRect.halfW, rb.halfW, candidateRect.halfH, rb.halfH);
      const margin = Math.max(1.1, Math.min(5.5, sizeScale * 0.35));
      const ai = {
        x0: candidateRect.x0 - margin,
        y0: candidateRect.y0 - margin,
        x1: candidateRect.x1 + margin,
        y1: candidateRect.y1 + margin,
      };
      const bi = { x0: rb.x0 - margin, y0: rb.y0 - margin, x1: rb.x1 + margin, y1: rb.y1 + margin };
      const { ox, oy } = overlapRect(ai, bi);
      return ox > 0 && oy > 0;
    });
    if (!overlapsExisting) {
      break;
    }
  } while (attempts < 40);

  const word = {
    id,
    text,
    top,
    left,
    scale,
    opacity: 0,
    life: Math.floor(randomInRange(MIN_LIFE, MAX_LIFE + 1)),
    phase: "in",
    fadeIn: true,
    outAt: null,
    locked: false, // layout not locked yet
    w: null,       // locked width in px
    h: null,       // locked height in px
  };
  return clampWordWithinBounds(word, exclusion);
}

export default function FrontagePage({ onNavigate }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [active, setActive] = useState([]);
  const [isExiting, setIsExiting] = useState(false);
  const [supportsFilter, setSupportsFilter] = useState(true);
  const queueRef = useRef(shuffle(KEYWORDS));
  const idRef = useRef(0);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const logoRef = useRef(null);
  const wordRefs = useRef(new Map()); // id -> HTMLElement
  const [exclusion, setExclusion] = useState(null); // { zones: [{x0,y0,x1,y1}], cw, ch }
  const exitTimerRef = useRef(null);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(mediaQuery.matches);
    updatePreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const detectSupport = () => {
      let supported = true;
      if (window.CSS && typeof window.CSS.supports === "function") {
        supported =
          window.CSS.supports("filter", "blur(1px)") ||
          window.CSS.supports("-webkit-filter", "blur(1px)");
      } else {
        const style = window.document?.body?.style;
        supported = !!style && ("filter" in style || "webkitFilter" in style);
      }
      setSupportsFilter(supported);
    };
    detectSupport();
    return undefined;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateRect = () => {
      const containerEl = containerRef.current;
      if (!containerEl) return;
      const c = containerEl.getBoundingClientRect();
      if (!c.width || !c.height) return;
      const zones = [];
      const addZone = (rect, padX, padY) => {
        if (!rect) return;
        const px = padX ?? 24;
        const py = padY ?? px;
        const x0 = Math.max(0, rect.left - c.left - px);
        const y0 = Math.max(0, rect.top - c.top - py);
        const x1 = Math.min(c.width, rect.right - c.left + px);
        const y1 = Math.min(c.height, rect.bottom - c.top + py);
        if (x1 <= x0 || y1 <= y0) return;
        zones.push({ x0, y0, x1, y1 });
      };

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const padX = Math.max(72, c.width * 0.1);
        const padY = Math.max(120, c.height * 0.16);
        addZone(titleRect, padX, padY);
      }

      if (logoRef.current) {
        const logoRect = logoRef.current.getBoundingClientRect();
        const padX = Math.max(56, c.width * 0.075);
        const padY = Math.max(80, c.height * 0.11);
        addZone(logoRect, padX, padY);
      }

      setExclusion({ zones, cw: c.width, ch: c.height });
    };

    updateRect();
    const ro = new ResizeObserver(updateRect);
    const observed = [containerRef.current, titleRef.current, logoRef.current].filter(Boolean);
    observed.forEach((el) => ro.observe(el));
    window.addEventListener("resize", updateRect);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateRect);
    };
  }, []);

  // Initialize active words on mount
  useEffect(() => {
    if (initialisedRef.current || !exclusion) {
      return;
    }
    initialisedRef.current = true;
    setActive(() => {
      const initial = [];
      while (initial.length < MAX_VISIBLE) {
        if (queueRef.current.length === 0) {
          queueRef.current = shuffle(KEYWORDS);
        }
        const text = queueRef.current.shift();
        idRef.current += 1;
        initial.push(makeWord(text, idRef.current, exclusion, initial));
      }
      separateWords(initial, exclusion);
      // We do not push out here because exclusion may be null, rely on animation tick
      return initial;
    });
  }, [exclusion]);

  useEffect(() => {
    if (reduceMotion) {
      // When reduced motion is on, keep words visible with no transitions
      setActive((words) =>
        words.map((w) => {
          const updated = {
            ...w,
            opacity: 1,
            phase: "hold",
            life: w.life > 0 ? w.life : MIN_LIFE,
          };
          return clampWordWithinBounds(updated, exclusion);
        })
      );
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActive((words) => {
        let newWords = [];

        for (const word of words) {
          let newWord = { ...word };

          if (word.phase === "in") {
            newWord.opacity = 1;      // triggers fade-in via CSS
            newWord.phase = "hold";  // start holding from next tick
            newWord.fadeIn = false;   // after this tick, treat as not fading in
          } else if (word.phase === "hold") {
            // Lock layout once so line breaks don't change mid-life
            if (!word.locked) {
              const el = wordRefs.current.get(word.id);
              if (el) {
                const rect = el.getBoundingClientRect();
                newWord.w = Math.round(rect.width);
                newWord.h = Math.round(rect.height);
                newWord.locked = true;
              }
            }
            newWord = clampWordWithinBounds(newWord, exclusion);
            newWord.life = word.life - 1;
            if (newWord.life <= 0) {
              newWord.phase = "out";
              newWord.opacity = 0;           // triggers CSS fade-out
              newWord.outAt = Date.now();     // mark fade start
            }
          } else if (word.phase === "out") {
            // Keep the word until fade-out duration has elapsed
            const started = word.outAt || Date.now();
            const elapsed = Date.now() - started;
            if (elapsed >= FADE_OUT_MS + 50) { // small buffer
              continue; // skip pushing this word, it's done fading
            }
          }
          newWord = clampWordWithinBounds(newWord, exclusion);
          newWords.push(newWord);
        }

        // Add new words to keep max visible count
        while (newWords.length < MAX_VISIBLE) {
          if (queueRef.current.length === 0) {
            queueRef.current = shuffle(KEYWORDS);
          }
          const text = queueRef.current.shift();
          idRef.current += 1;
          newWords.push(makeWord(text, idRef.current, exclusion, newWords));
        }

        separateWords(newWords, exclusion);
        newWords = newWords.map((w) => clampWordWithinBounds(pushOutOfExclusion(w, exclusion), exclusion));

        return newWords;
      });
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [reduceMotion, exclusion]);

  const triggerVideoNavigation = useCallback(() => {
    if (onNavigate) {
      onNavigate("story");
    }
  }, [onNavigate]);

  const handleNavigateToVideo = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (isExiting) return;
      if (reduceMotion) {
        triggerVideoNavigation();
        return;
      }
      if (typeof window === "undefined") {
        triggerVideoNavigation();
        return;
      }
      setIsExiting(true);
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null;
        triggerVideoNavigation();
      }, 480);
    },
    [isExiting, reduceMotion, triggerVideoNavigation]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavigateToVideo(event);
      }
    },
    [handleNavigateToVideo]
  );

  useEffect(() => {
    return () => {
      if (exitTimerRef.current && typeof window !== "undefined") {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, []);

  const styles = useMemo(() => {
    return active.map((word) => {
      const fadeMs = word.fadeIn ? FADE_IN_MS : FADE_OUT_MS;
      const transitionParts = [];
      if (!reduceMotion) {
        transitionParts.push(`opacity ${fadeMs}ms ease-in-out`);
        if (supportsFilter) {
          transitionParts.push(`filter ${fadeMs}ms ease-in-out`);
        }
      }
      const filterValue = supportsFilter
        ? (reduceMotion
          ? "blur(0px)"
          : word.opacity === 1
            ? "blur(0px)"
            : word.fadeIn
              ? "blur(8px)"
              : "blur(14px)")
        : undefined;
      const willChangeProps = ["opacity"];
      if (supportsFilter) {
        willChangeProps.push("filter");
      }
      return {
        top: `${word.top}%`,
        left: `${word.left}%`,
        opacity: word.opacity,
        transform: `translate(-50%, -50%) scale(${word.scale})`,
        ...(reduceMotion
          ? { transition: "none" }
          : transitionParts.length > 0
            ? { transition: transitionParts.join(", ") }
            : {}),
        display: "inline-block",
        whiteSpace: "normal",
        ...(word.locked && word.w != null ? { width: `${word.w}px` } : null),
        ...(word.locked && word.h != null ? { height: `${word.h}px` } : null),
        lineHeight: 1,
        transformOrigin: "50% 50%",
        willChange: willChangeProps.join(", "),
        ...(supportsFilter ? { filter: filterValue } : null),
      };
    });
  }, [active, reduceMotion, supportsFilter]);

  return (
    <div
      ref={containerRef}
      className={`frontage-page${isExiting ? " frontage-exit" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleNavigateToVideo}
      onKeyDown={handleKeyDown}
      aria-label="Watch the programme introduction video"
      aria-describedby="frontage-hint"
      aria-busy={isExiting}
      style={{
        width: "100vw",
        height: "var(--vh, 100vh)",
        minHeight: "var(--vh, 100vh)",
        overflow: "hidden",
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      <span className="frontage-sr">Explore the programme overview</span>
      <img ref={logoRef} className="frontage-logo" src={uweLogo} alt="UWE Bristol logo" />
      <div className="frontage-inner">
        <div
          ref={titleRef}
          className="frontage-title"
          aria-hidden="true"
          style={{ background: "transparent", boxShadow: "none", backdropFilter: "none", color: "#000", zIndex: 1 }}
        >
          <span className="frontage-title-line" style={{ fontSize: "clamp(20px, 5vw, 42px)", color: "#000" }}>
            BSc (Hons) Architecture
          </span>
          <span className="frontage-title-line secondary" style={{ fontSize: "clamp(16px, 4vw, 32px)", color: "#000" }}>
            Open Day
          </span>
        </div>
        <div className="frontage-cloud" aria-hidden="true" style={{ zIndex: 3 }}>
          {active.map((word, index) => (
            <span
              key={word.id}
              ref={(el) => { if (el) wordRefs.current.set(word.id, el); }}
              className="frontage-word"
              style={{ ...styles[index], color: "#fff" }}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>
      <span id="frontage-hint" className="frontage-hint" aria-hidden="true">
        Click anywhere to start
      </span>
    </div>
  );
}
