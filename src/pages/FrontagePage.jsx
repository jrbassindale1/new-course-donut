import { useCallback, useEffect, useMemo, useState } from "react";

const KEYWORDS = [
  "Transforming Futures",
  "Outstanding learning",
  "Enterprise and enterprising culture",
  "Inclusivity and inclusive",
  "Sustainability and climate change resilience",
  "Health and wellbeing",
  "Digital futures and technology",
  "Local economic prosperity and regional impact",
  "People – opportunity to thrive and flourish",
  "Global reach and place – local and global gateway",
];

const UPDATE_INTERVAL_MS = 4000;

const randomInRange = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createWordState = (text, index, total) => {
  const angle = (index / total) * Math.PI * 2;
  const radius = randomInRange(18, 32);
  return {
    text,
    top: clamp(50 + Math.sin(angle) * radius, 10, 90),
    left: clamp(50 + Math.cos(angle) * radius, 10, 90),
    scale: randomInRange(0.85, 1.35),
    opacity: randomInRange(0.35, 0.95),
    duration: randomInRange(6, 12),
    delay: randomInRange(0, 4),
    rotate: randomInRange(-8, 8),
  };
};

const evolveWordState = (state) => ({
  ...state,
  top: randomInRange(12, 88),
  left: randomInRange(12, 88),
  scale: randomInRange(0.8, 1.3),
  opacity: randomInRange(0.35, 0.9),
  duration: randomInRange(6, 12),
  delay: randomInRange(0, 4),
  rotate: randomInRange(-6, 6),
});

export default function FrontagePage({ onNavigate }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [wordStates, setWordStates] = useState(() =>
    KEYWORDS.map((text, index) => createWordState(text, index, KEYWORDS.length))
  );

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
    if (reduceMotion) return undefined;

    const id = window.setInterval(() => {
      setWordStates((states) => states.map((state) => evolveWordState(state)));
    }, UPDATE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const handleNavigateToChart = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (onNavigate) {
        onNavigate("chart");
      }
    },
    [onNavigate]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavigateToChart(event);
      }
    },
    [handleNavigateToChart]
  );

  const styles = useMemo(
    () =>
      wordStates.map((word) => ({
        top: `${word.top}%`,
        left: `${word.left}%`,
        opacity: word.opacity,
        transform: `translate(-50%, -50%) scale(${word.scale}) rotate(${word.rotate}deg)`,
        transitionProperty: "top, left, transform, opacity",
        transitionDuration: reduceMotion ? "0s" : `${word.duration}s`,
        transitionDelay: reduceMotion ? "0s" : `${word.delay}s`,
      })),
    [reduceMotion, wordStates]
  );

  return (
    <div
      className="frontage-page"
      role="button"
      tabIndex={0}
      onClick={handleNavigateToChart}
      onKeyDown={handleKeyDown}
      aria-label="Enter the programme chart"
      aria-describedby="frontage-hint"
    >
      <span className="frontage-sr">Explore the programme overview</span>
      <div className="frontage-inner">
        <div className="frontage-title" aria-hidden="true">
          <span className="frontage-title-line">BSc Architecture</span>
          <span className="frontage-title-line secondary">@ UWE Bristol</span>
        </div>
        <div className="frontage-cloud" aria-hidden="true">
          {wordStates.map((word, index) => (
            <span key={word.text} className="frontage-word" style={styles[index]}>
              {word.text}
            </span>
          ))}
        </div>
      </div>
      <span id="frontage-hint" className="frontage-hint" aria-hidden="true">
        Click anywhere to view the chart
      </span>
    </div>
  );
}
