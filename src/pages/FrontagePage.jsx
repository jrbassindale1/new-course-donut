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
const MOVE_MIN = 4.0;       // soft continuous movement
const MOVE_MAX = 6.0;

const SPEED_MIN = 0.35;     // % per second (gentler)
const SPEED_MAX = 0.7;      // % per second

function computeSpeed(word) {
  return Math.hypot(word.vx || 0, word.vy || 0);
}

function reflectFromBounds(word, exclusion) {
  if (!exclusion) return word;
  const r = rectFor(word, exclusion);
  const minX = 8 + r.halfW; const maxX = 92 - r.halfW;
  const minY = 8 + r.halfH; const maxY = 92 - r.halfH;
  let { top, left, vx, vy } = word;
  if (left < minX) { left = minX; vx = Math.abs(vx); }
  if (left > maxX) { left = maxX; vx = -Math.abs(vx); }
  if (top  < minY) { top  = minY; vy = Math.abs(vy); }
  if (top  > maxY) { top  = maxY; vy = -Math.abs(vy); }
  return { ...word, top, left, vx, vy };
}

function reflectFromExclusion(word, exclusion) {
  if (!exclusion) return word;
  const { x0, y0, x1, y1, cw, ch } = exclusion;
  const x = (word.left / 100) * cw;
  const y = (word.top / 100) * ch;
  const rpx = estimateRadius(word);
  const rx0 = x0 - rpx;
  const ry0 = y0 - rpx;
  const rx1 = x1 + rpx;
  const ry1 = y1 + rpx;
  const inside = (x > rx0 && x < rx1 && y > ry0 && y < ry1);
  if (!inside) return word;
  // Reflect velocity away from the title centre
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let dx = x - cx; let dy = y - cy;
  const mag = Math.hypot(dx, dy) || 1;
  dx /= mag; dy /= mag; // unit vector away
  const speed = computeSpeed(word) || randomInRange(SPEED_MIN, SPEED_MAX);
  // Push position to the edge of the exclusion plus a small padding
  const px = x < cx ? rx0 - 6 : rx1 + 6;
  const py = y < cy ? ry0 - 6 : ry1 + 6;
  const leftPct = clamp((px / cw) * 100, 0, 100);
  const topPct  = clamp((py / ch) * 100, 0, 100);
  return { ...word, left: leftPct, top: topPct, vx: dx * speed, vy: dy * speed };
}

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
  if (!exclusion) return false;
  const { x0, y0, x1, y1, cw, ch } = exclusion;
  const x = (leftPct / 100) * cw;
  const y = (topPct / 100) * ch;
  const rpx = (radiusPct / 100) * Math.min(cw, ch);
  const inX = x > x0 - rpx && x < x1 + rpx;
  const inY = y > y0 - rpx && y < y1 + rpx;
  return inX && inY;
}

function pushOutOfExclusion(word, exclusion) {
  if (!exclusion) return word;
  const { x0, y0, x1, y1, cw, ch } = exclusion;
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

function separateWords(words, exclusion) {
  if (!exclusion) return words;
  const MAX_ITERS = 8;
  const MARGIN = 0.6; // % extra spacing cushion
  for (let it = 0; it < MAX_ITERS; it++) {
    let movedAny = false;
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const a = words[i];
        const b = words[j];
        const ra = rectFor(a, exclusion);
        const rb = rectFor(b, exclusion);
        // Inflate a tiny margin to reduce visual cramping
        const ai = { x0: ra.x0 - MARGIN, y0: ra.y0 - MARGIN, x1: ra.x1 + MARGIN, y1: ra.y1 + MARGIN };
        const bi = { x0: rb.x0 - MARGIN, y0: rb.y0 - MARGIN, x1: rb.x1 + MARGIN, y1: rb.y1 + MARGIN };
        const { ox, oy } = overlapRect(ai, bi);
        if (ox > 0 && oy > 0) {
          // Move along the axis of least separation
          if (ox < oy) {
            const push = ox / 2;
            a.left -= push;
            b.left += push;
          } else {
            const push = oy / 2;
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

function makeWord(text, id, exclusion) {
  let top, left, scale;
  let attempts = 0;
  do {
    top = randomInRange(18, 82);
    left = randomInRange(18, 82);
    scale = randomInRange(0.85, 1.55);
    attempts++;
    // convert approximate radius to percentage of container's smaller side
    const dummy = { text, scale };
    const rpx = estimateRadius(dummy);
    // assume a 1000px reference to map px→% conservatively if exclusion unknown
    const ref = 1000;
    const rPct = (rpx / ref) * 100;
    if (!exclusion || !isInsideExclusionPct(top, left, rPct, exclusion)) break;
  } while (attempts < 30);

  // Assign a straight-line velocity (random direction)
  const angle = randomInRange(0, Math.PI * 2);
  const speed = randomInRange(SPEED_MIN, SPEED_MAX); // % per second
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  return {
    id,
    text,
    top,
    left,
    scale,
    vx,
    vy,
    opacity: 0,
    life: Math.floor(randomInRange(MIN_LIFE, MAX_LIFE + 1)),
    phase: "in",
    moveDur: randomInRange(MOVE_MIN, MOVE_MAX),
    fadeIn: true,
    outAt: null,
    locked: false, // layout not locked yet
    w: null,       // locked width in px
    h: null,       // locked height in px
  };
}

function evolve(word, exclusion) {
  // Straight-line motion at constant velocity (percent per second)
  const dt = TICK_MS / 1000; // seconds per tick
  let top = word.top + (word.vy || 0) * dt;
  let left = word.left + (word.vx || 0) * dt;
  let moved = { ...word, top, left };
  // Bounce on outer bounds
  moved = reflectFromBounds(moved, exclusion);
  // Reflect away from the title exclusion if we wandered inside
  moved = reflectFromExclusion(moved, exclusion);
  return moved;
}

export default function FrontagePage({ onNavigate }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [active, setActive] = useState([]);
  const [isExiting, setIsExiting] = useState(false);
  const queueRef = useRef(shuffle(KEYWORDS));
  const idRef = useRef(0);

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const wordRefs = useRef(new Map()); // id -> HTMLElement
  const [exclusion, setExclusion] = useState(null); // {x0,y0,x1,y1} in container pixels
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
    if (!containerRef.current || !titleRef.current) return;
    const updateRect = () => {
      const c = containerRef.current.getBoundingClientRect();
      const t = titleRef.current.getBoundingClientRect();
      // Normalize title rect into container coordinates
      const x0 = Math.max(0, t.left - c.left - 24);
      const y0 = Math.max(0, t.top - c.top - 24);
      const x1 = Math.min(c.width, t.right - c.left + 24);
      const y1 = Math.min(c.height, t.bottom - c.top + 24);
      setExclusion({ x0, y0, x1, y1, cw: c.width, ch: c.height });
    };
    updateRect();
    const ro = new ResizeObserver(updateRect);
    ro.observe(containerRef.current);
    ro.observe(titleRef.current);
    window.addEventListener('resize', updateRect);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateRect);
    };
  }, []);

  // Initialize active words on mount
  useEffect(() => {
    if (initialisedRef.current) {
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
        initial.push(makeWord(text, idRef.current, exclusion));
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
        words.map((w) => ({
          ...w,
          opacity: 1,
          phase: "hold",
          life: w.life > 0 ? w.life : MIN_LIFE,
        }))
      );
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActive((words) => {
        let newWords = [];
        let removedWords = [];

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
            newWord.life = word.life - 1;
            // Straight-line evolve
            newWord = evolve(newWord, exclusion);
            if (newWord.life <= 0) {
              newWord.phase = "out";
              newWord.opacity = 0;           // triggers CSS fade-out
              newWord.outAt = Date.now();     // mark fade start
            }
          } else if (word.phase === "out") {
            // Keep the word until fade-out duration has elapsed
            const started = word.outAt || Date.now();
            const elapsed = Date.now() - started;
            // Optional: tiny drift while fading out (keeps things organic)
            newWord = evolve(newWord, exclusion);
            if (elapsed >= FADE_OUT_MS + 50) { // small buffer
              removedWords.push(word);
              continue; // skip pushing this word, it's done fading
            }
          }
          newWords.push(newWord);
        }

        // Add new words to keep max visible count
        while (newWords.length < MAX_VISIBLE) {
          if (queueRef.current.length === 0) {
            queueRef.current = shuffle(KEYWORDS);
          }
          const text = queueRef.current.shift();
          idRef.current += 1;
          newWords.push(makeWord(text, idRef.current, exclusion));
        }

        separateWords(newWords, exclusion);
        newWords = newWords.map((w) => pushOutOfExclusion(w, exclusion));

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
      const transitionDuration = reduceMotion
        ? "0s"
        : `${word.moveDur}s, ${word.moveDur}s, ${word.moveDur}s, ${fadeMs}ms, ${fadeMs}ms`;
      return {
        top: `${word.top}%`,
        left: `${word.left}%`,
        opacity: word.opacity,
        filter: word.opacity === 1 ? "blur(0px)" : (word.fadeIn ? "blur(8px)" : "blur(14px)"),
        transform: `translate(-50%, -50%) scale(${word.scale})`,
        transitionProperty: "top, left, transform, opacity, filter",
        transitionDuration,
        transitionTimingFunction: "linear",
        display: "inline-block",
        whiteSpace: "normal",
        ...(word.locked && word.w != null ? { width: `${word.w}px` } : null),
        ...(word.locked && word.h != null ? { height: `${word.h}px` } : null),
        lineHeight: 1,
        transformOrigin: "50% 50%",
        willChange: "top, left, transform, opacity, filter",
      };
    });
  }, [active, reduceMotion]);

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
      <img className="frontage-logo" src={uweLogo} alt="UWE Bristol logo" />
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
