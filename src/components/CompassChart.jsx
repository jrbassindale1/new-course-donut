import React from "react";
import moduleInfo from "../data/moduleInfo.json";

// Polar helpers
const RAD = Math.PI / 180;
const toXY = (cx, cy, r, angleDeg) => {
  const a = (angleDeg - 90) * RAD; // 0 at top
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

// Single circular arc path for stroked ring segments (rounded caps via strokeLinecap)
const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const [sx, sy] = toXY(cx, cy, r, startDeg);
  const [ex, ey] = toXY(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) % 360 > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0; // clockwise if end > start (with our 0 at top convention)
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`;
};

// Text along arc using <textPath>
function ArcLabel({ id, cx, cy, r, start, end, text, fill = "#111827", fontSize = 12, fontWeight = 'normal', startOffset = '50%', textAnchor = 'middle' }) {
  if (!text) return null;
  const pathId = `${id}-path`;
  const d = arcPath(cx, cy, r, start, end);
  return (
    <g>
      <defs>
        <path id={pathId} d={d} />
      </defs>
      <text fill={fill} fontSize={fontSize} fontWeight={fontWeight} style={{ pointerEvents: 'none' }}>
        <textPath href={`#${pathId}`} startOffset={startOffset} textAnchor={textAnchor}>{text}</textPath>
      </text>
    </g>
  );
}

// CompassChart renders three bands: top concurrent, bottom concurrent, and a thick solo Pathway overlay.
export default function CompassChart({ width = 680, height = 680, padding = 6, colors, onSelect, onInfoSelect, resetSignal }) {
  const W = width;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;

  // Radii and thickness
  const baseThickness = 40; // thinner concurrent band thickness so all modules fit
  const gap = 0;            // space between bands (within a year)
  // Elements that extend beyond module outer edge
  const bandExtra = 18;     // px extra outward thickness for background bands (wider for clearer year labels)
  const thinBand = 0;      // px – thin guide ring
  // Ensure the SVG viewBox always has enough breathing room so strokes don't clip.
  // The furthest outward element is max(bandExtra, thinBand). Add a small safety margin (3px).
  const PAD_SAFE = Math.max(bandExtra, thinBand);
  const PAD = Math.max(padding, PAD_SAFE);
  const outerR = Math.min(W, H) / 2 - PAD; // fixed outer radius with safe padding
  const bottomR = outerR - baseThickness / 2;  // center radius for bottom band stroke
  const topR = outerR - baseThickness - gap - baseThickness / 2; // center radius for top band stroke
  const soloThickness = baseThickness * 2 + gap; // double thickness + gap to span both
  // Center the solo band so it spans both concurrent bands plus the gap
  const soloR = outerR - (soloThickness / 2);

  // Thin outer guide ring just outside modules
  // Place thin ring so its inner edge touches the module outer edge
  const thinR = outerR + thinBand / 2;   // inner edge = outerR

  // Thin inner guide ring (Year 2) just inside modules (between Y1 and Y2)
  const innerEdge = (topR - baseThickness / 2);               // inner boundary of Y1 modules
  const ringGap = 6;                                          // desired radial gap between Y1 inner edge and Y2 ring
  const innerThinR = innerEdge - ringGap - thinBand / 2;      // ring outer edge = innerEdge - ringGap

  // Year spacing: choose uniform spacing between the centre of each year's solo ring
  const YEAR_SPACING = 65; // px between centre of year solo rings (smaller -> rings closer together)
  // Use Year 1 soloR as the reference outermost module ring and compute Year 2/3 positions
  const y1SoloR = soloR + 0; // nudge all modules slightly outward for a larger radius
  const y2SoloR = y1SoloR - YEAR_SPACING;
  const y3SoloR = y1SoloR - YEAR_SPACING * 2;
  // Year 2 band geometry (centered on computed soloR)
  const y2SoloThickness = baseThickness * 2 + gap;
  const y2TopR = y2SoloR - y2SoloThickness / 2;
  const y2BottomR = y2SoloR + y2SoloThickness / 2;

  // Year 3 band geometry (centered on computed soloR)
  const innerEdge2 = y2TopR - baseThickness / 2; // inner boundary of Y2 modules
  const innerThinR2 = innerEdge2 - ringGap - thinBand / 2; // separation ring to Y3 (kept for reference)
  const y3SoloThickness = baseThickness * 2 + gap;
  const y3TopR = y3SoloR - y3SoloThickness / 2;
  const y3BottomR = y3SoloR + y3SoloThickness / 2;

  // Info Wheel placement: fixed position regardless of selected year
  const INFO_RING_INSET = 8; // px inset from reference inner edge
  const INFO_CONTENT_R = (y3SoloR - baseThickness / 2) - INFO_RING_INSET; // stable radius

  // Colour palette fallback
  const C = colors || {
    aea: "#4F46E5",
    cap: "#22C55E",
    pathway: "#F59E0B",
    explore: "#8B5CF6",
    zc: "#06B6D4",
    grid: "#9CA3AF",
  };
  // Swap greys: use darker grey for muted elements, lighter grey for backgrounds
  const muted = "#FFFFFF";
  const baseStroke = "#FFFFFF"; // default white segments when nothing is selected
  const selectedColor = "#F59E0B"; // selected module colour (deeper)
  const hoverColor = "#FACC15";    // hover module colour (slightly lighter/different)
  // Programme/info wheel palette for consistency
  const infoBaseColor = '#FDE047';
  const infoHoverColor = '#FACC15';
  const infoSelectedColor = '#F59E0B';

  // Tangential gap between modules (px along the arc length)
  const MODULE_GAP_PX = 8;
  const gapAngle = (r) => (MODULE_GAP_PX / (2 * Math.PI * r)) * 360;
  const trim = (arc, r) => {
    const g = gapAngle(r) / 2;
    return { start: arc.start + g, end: arc.end - g };
  };

  // Build per-year module arcs from moduleInfo.json using credits -> degrees mapping
  // Assumption: total credits per academic year = 120
  const buildYearArcs = (ids, radius) => {
    // ids: array of module ids in order around the ring
    // gather modules and their credits
    const modules = ids.map(id => {
      const m = moduleInfo[id];
      const credits = m && m.keyInfo && Array.isArray(m.keyInfo) ? Number((m.keyInfo.find(k => k.label === 'Credits') || {}).value) : (m && m.keyInfo && m.keyInfo[0] && Number(m.keyInfo[0].value)) || 0;
      return { id, credits: Number(credits || 0), name: m && m.moduleName };
    });
    // Normalize by the sum of the credits in this year so the year fills 360°
    const sumCredits = modules.reduce((s, m) => s + (m.credits || 0), 0) || 120; // fallback
    const startAt = 0; // start at top (0°)
    let angle = startAt;
    const arcs = modules.map(m => {
      const deg = ((m.credits || 0) / sumCredits) * 360;
      const arc = { id: m.id, start: angle, end: angle + deg, credits: m.credits, name: m.name };
      const trimmed = trim(arc, radius);
      angle += deg;
      return { ...arc, trimmed };
    });
    return arcs;
  };

  // Local selection + rotation state
  const [selected, setSelected] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);
  // Initial view: keep chart upright so Year 1 is at top
  const [rotation, setRotation] = React.useState(0);
  const [infoRotation, setInfoRotation] = React.useState(0);
  const [infoSelected, setInfoSelected] = React.useState(null);
  const [infoHovered, setInfoHovered] = React.useState(null);
  const [progRotation, setProgRotation] = React.useState(0);
  const [progSelected, setProgSelected] = React.useState(null);
  const [isResetting, setIsResetting] = React.useState(false);
  const [isSpinning, setIsSpinning] = React.useState(false);
  // Programme ring re-appearance smoothing on reset
  const [progReappearing, setProgReappearing] = React.useState(false);
  const [progEnter, setProgEnter] = React.useState(false);
  // Coordinated reset timings so all parts feel synced
  // Reset timing
  const BASE_RESET_TRANS_MS = 3200; // full reset duration when large movement
  const QUICK_RESET_MS = 900;       // snappier reset when already near neutral
  const RESET_FADE_MS = 700;        // slightly faster de-fade to avoid long wait
  const TRANS_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const WILL_CHANGE = 'transform, opacity';
  const STAGGER_MS = 0;        // legacy; unused for programme ring now
  const PROG_TRANS_DELAY_MS = 80;   // gentle delay so it feels staged, not laggy
  const PROG_OPACITY_DELAY_MS = 0;  // no lag on de-fade at the end
  const NORMAL_TRANS_MS = 1800; // default rotation duration (non-reset, slower)
  const HOVER_TRANS_MS = 220;   // unify hover fades
  const [resetDurMs, setResetDurMs] = React.useState(BASE_RESET_TRANS_MS);
  React.useEffect(() => {
    // Determine if we're already in the neutral pose to shorten the reset
    const alreadyNeutral = (selected === null && rotation === 0 && infoRotation === 0 && progRotation === 0);
    // If we are coming from a selected state, the programme ring will re-appear: fade it from 0 -> 0.6 smoothly
    const reappearing = !!selected;
    setProgReappearing(reappearing);
    setProgEnter(false);
    const enterTimer = setTimeout(() => setProgEnter(true), 60);
    const dur = alreadyNeutral ? QUICK_RESET_MS : BASE_RESET_TRANS_MS;
    setResetDurMs(dur);
    // Reset selection and rotation when signal changes
    setIsResetting(true);
    setIsSpinning(false);
    setSelected(null);
    setRotation(0);
    setInfoRotation(0);
    setInfoSelected(null);
    setInfoHovered(null);
    setProgRotation(0);
    setProgSelected(null);
    const t = setTimeout(() => setIsResetting(false), dur);
    return () => { clearTimeout(t); clearTimeout(enterTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);
  const midOf = (arc) => (arc.start + arc.end) / 2;
  const selectAndRotate = (key, arc) => () => {
    if (selected === key) {
      onSelect && onSelect(key);
      return;
    }
    setSelected(key);
    const mid = midOf(arc);
    setIsSpinning(true);
    setRotation(-mid); // bring arc midpoint to 0° at top
    // Clear spinning flag after transition
    setTimeout(() => setIsSpinning(false), NORMAL_TRANS_MS + 50);
  };

  const strokeFor = (id) => {
    // If a selection exists, keep selected deep yellow; allow hover on others
    if (selected) {
      if (id === selected) return selectedColor;
      if (hovered === id) return hoverColor;
      return muted;
    }
    // No selection: hovered module turns hover yellow
    if (hovered === id) return hoverColor;
    return baseStroke;
  };

  // Label fill: when a module is selected, grey out other modules' text
  const labelFillFor = (id) => {
    // Modules
    // - Selected: dark
    // - Hover (not selected): white for contrast on bright yellow
    // - Otherwise: default dark or muted when something else is selected
    if (selected) {
      if (id === selected) return '#111827';
      if (hovered === id) return '#FFFFFF';
      return '#d1d5db';
    }
    if (hovered === id) return '#FFFFFF';
    return '#111827';
  };

  // Year selection logic
  const year1Ids = new Set(['UBLL46-30-3','UBLL48-15-3','UBLL47-30-3','UBLL49-15-3','UBLL45-30-3']);
  const year2Ids = new Set(['UBLL4A-60-M','UBLL4B-15-M','UBLL4C-15-M','UBLL4F-30-M']);
  const year3Ids = new Set(['Y3MOD1','Y3MOD2','Y3MOD3','Y3MOD4','Y3MOD5']);
  const selectedYear = selected
    ? (year1Ids.has(selected) ? 1 : (year2Ids.has(selected) ? 2 : (year3Ids.has(selected) ? 3 : null)))
    : null;
  const showYear1 = !selectedYear || selectedYear === 1;
  const showYear2 = !selectedYear || selectedYear === 2;
  const showYear3 = !selectedYear || selectedYear === 3;
  const expandY2 = selectedYear === 2;
  const expandY3 = selectedYear === 3;
  const showInfoWheel = !!selected; // show for both Y1 and Y2 selections

  // Info wheel colours mimic module behaviour
  const infoStrokeFor = (id) => {
    // Use programme colours for module info wheel segments
    if (infoSelected) {
      if (id === infoSelected) return infoSelectedColor;
      if (id === infoHovered) return infoHoverColor;
      return infoBaseColor;
    }
    if (id === infoHovered) return infoHoverColor;
    return infoBaseColor;
  };
  const infoLabelFillFor = (id) => {
    // Info wheel labels: when a section is selected, only labels change to muted grey for unselected;
    // segments stay yellow (see infoStrokeFor).
    if (infoSelected) {
      if (id === infoSelected) return '#111827'; // selected: dark text
      if (id === infoHovered) return '#FFFFFF';   // hovered: white text
      return '#6b7280';
    }
    if (id === infoHovered) return '#FFFFFF';
    return '#FFFFFF'; // default for base yellow segments
  };

  // Background bands: expand outward only, keep inner edge aligned
  // Year 1 background metrics (uniform band thickness)
  const y1BgInner = y1SoloR - baseThickness / 2;
  const y1BgThick = baseThickness + bandExtra;
  const y1BgR = y1BgInner + y1BgThick / 2;
  const y1BgOuter = y1BgInner + y1BgThick;
  // Disable any inward-shift for Year 2 to keep uniform spacing between rings
  const y2InwardShift = 0;

  // Effective Year 2 radii using the computed shift
  const y2TopR_eff = expandY2 ? topR : (y2TopR - y2InwardShift);
  const y2BottomR_eff = expandY2 ? bottomR : (y2BottomR - y2InwardShift);
  const y2SoloR_eff = expandY2 ? y1SoloR : (y2SoloR - y2InwardShift);
  // Year 2 solo thickness effective
  const y2SoloThickness_eff = expandY2 ? soloThickness : y2SoloThickness;

  // Disable Y3 inward-shift as well; use uniform YEAR_SPACING.
  const y3InwardShift = 0;

  // Effective Year 3 radii using the computed shift
  const y3TopR_eff = expandY3 ? topR : (y3TopR - y3InwardShift);
  const y3BottomR_eff = expandY3 ? bottomR : (y3BottomR - y3InwardShift);
  const y3SoloR_eff = expandY3 ? y1SoloR : (y3SoloR - y3InwardShift);
  const y3SoloThickness_eff = expandY3 ? soloThickness : y3SoloThickness;

  // Year ordering and ids (use the same ids sets as before but in semester order)
  const Y1_ORDER = ['UBLL48-15-3','UBLL46-30-3','UBLL47-30-3','UBLL49-15-3','UBLL45-30-3'];
  const Y2_ORDER = ['UBLL4B-15-M','UBLL4A-60-M','UBLL4C-15-M','UBLL4F-30-M'];
  const Y3_ORDER = ['Y3MOD1','Y3MOD3','Y3MOD2','Y3MOD4','Y3MOD5'];

  const year1Arcs = buildYearArcs(Y1_ORDER, y1SoloR);
  const year2Arcs = buildYearArcs(Y2_ORDER, y2SoloR_eff);
  const year3Arcs = buildYearArcs(Y3_ORDER, y3SoloR_eff);

  // Year 2 background metrics (uniform band thickness)
  const y2BgInner = y2SoloR_eff - baseThickness / 2;
  const y2BgThick = baseThickness + bandExtra;
  const y2BgR = y2BgInner + y2BgThick / 2;
  const y2BgOuter = y2BgInner + y2BgThick;

  // Year 3 background metrics (uniform band thickness)
  const y3BgInner = y3SoloR_eff - baseThickness / 2;
  const y3BgThick = baseThickness + bandExtra;
  const y3BgR = y3BgInner + y3BgThick / 2;
  const y3BgOuter = y3BgInner + y3BgThick;

  // Year label radii positioned near outer edge of background bands
  const labelInset = 14; // px inside the band outer edge (bring labels slightly inward)
  const year1LabelR = y1BgOuter - labelInset;
  const year2LabelR = y2BgOuter - labelInset;
  const year3LabelR = y3BgOuter - labelInset;

  // When a module is selected, default the Info Wheel to "Synopsis"
  // and rotate it so the Synopsis text sits exactly at the top.
  React.useEffect(() => {
    if (selected) {
      setInfoSelected('syn');
      const hasThreads = !!(moduleInfo[selected] && Array.isArray(moduleInfo[selected].threads) && moduleInfo[selected].threads.length > 0);
      const headings = [
        { id: 'key' },
        { id: 'syn' },
        { id: 'out' },
        { id: 'arb' },
        ...(hasThreads ? [{ id: 'thr' }] : []),
      ];
      const sector = 360 / headings.length;
      // Must match Info Wheel content radius below (fixed for all years)
      const contentR = INFO_CONTENT_R;
      const synIndex = headings.findIndex(h => h.id === 'syn');
      const start = synIndex * sector;
      const end = start + sector;
      const trimmed = trim({ start, end }, contentR);
      const mid = (trimmed.start + trimmed.end) / 2;
      setInfoRotation(-mid);
      if (onInfoSelect) onInfoSelect(selected, 'synopsis');
    } else {
      setInfoSelected(null);
      setInfoRotation(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Fade styles for year groups
  const fadeStyleY1 = { opacity: showYear1 ? 1 : 0, transition: 'opacity 450ms ease', pointerEvents: showYear1 ? 'auto' : 'none' };
  const fadeStyleY2 = { opacity: showYear2 ? 1 : 0, transition: 'opacity 450ms ease', pointerEvents: showYear2 ? 'auto' : 'none' };
  const fadeStyleY3 = { opacity: showYear3 ? 1 : 0, transition: 'opacity 450ms ease', pointerEvents: showYear3 ? 'auto' : 'none' };

  return (
    <svg className="compass-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Programme overview compass">
      <defs>
        {/* Clip inner half of strokes to simulate inner highlight border on hover */}
  <clipPath id="clip-inner-solo"><circle cx={cx} cy={cy} r={y1SoloR - y1BgThick/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-top"><circle cx={cx} cy={cy} r={topR - baseThickness/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-bottom"><circle cx={cx} cy={cy} r={bottomR - baseThickness/2 + 0.5} /></clipPath>
  <clipPath id="clip-inner-y2solo"><circle cx={cx} cy={cy} r={y2SoloR_eff - y2SoloThickness_eff/2 + 0.5} /></clipPath>
  <clipPath id="clip-inner-y2top"><circle cx={cx} cy={cy} r={y2TopR_eff - baseThickness/2 + 0.5} /></clipPath>
  <clipPath id="clip-inner-y2bottom"><circle cx={cx} cy={cy} r={y2BottomR_eff - baseThickness/2 + 0.5} /></clipPath>
  <clipPath id="clip-inner-y3solo"><circle cx={cx} cy={cy} r={y3SoloR_eff - y3SoloThickness_eff/2 + 0.5} /></clipPath>
  <clipPath id="clip-inner-y3top"><circle cx={cx} cy={cy} r={y3TopR_eff - baseThickness/2 + 0.5} /></clipPath>
  <clipPath id="clip-inner-y3bottom"><circle cx={cx} cy={cy} r={y3BottomR_eff - baseThickness/2 + 0.5} /></clipPath>
      </defs>
      {/* Background year bands spanning full module thickness (thicker + fade when hidden)
          Keep inner edge aligned; add thickness outward. */}
      <g>
        {/* Year 1 background band */}
        <g style={fadeStyleY1}>
          <circle cx={cx} cy={cy} r={y1BgR} stroke="#ccd0d8" strokeWidth={y1BgThick} fill="none" />
        </g>
        {/* Year 2 background band (expands when Year 2 selected) */}
        <g style={fadeStyleY2}>
          <circle cx={cx} cy={cy} r={y2BgR} stroke="#ccd0d8" strokeWidth={y2BgThick} fill="none" />
        </g>
        {/* Year 3 background band */}
        <g style={fadeStyleY3}>
          <circle cx={cx} cy={cy} r={y3BgR} stroke="#ccd0d8" strokeWidth={y3BgThick} fill="none" />
        </g>
      </g>
      {/* Stationary thin outer guide ring removed (was creating an extra outer band) */}

      {/* Inner thin guide ring omitted to avoid extra band */}

      {/* Info Wheel (appears when any module is selected) - render beneath modules */}
      {showInfoWheel && (
        <g style={{ transform: `rotate(${infoRotation}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: `transform ${isResetting ? resetDurMs : NORMAL_TRANS_MS}ms ${TRANS_EASE}`, willChange: WILL_CHANGE, pointerEvents: (isResetting || isSpinning) ? 'none' : 'auto' }}>
          {(() => {
            // Build headings dynamically: include Threads only when present for the selected module
            const hasThreads = selected && moduleInfo[selected] && Array.isArray(moduleInfo[selected].threads) && moduleInfo[selected].threads.length > 0;
            const headings = [
              { id: 'key', label: 'Key Info' },
              { id: 'syn', label: 'Synopsis' },
              { id: 'out', label: 'Module Outcomes' },
              { id: 'arb', label: 'ARB Competencies' },
              // Conditionally include Threads
              ...(hasThreads ? [{ id: 'thr', label: 'Studio Threads' }] : []),
            ];
            const sector = 360 / headings.length;
            // Fixed radius so info wheel appears in the same place for each year
            const infoR = INFO_CONTENT_R;
            const infoThick = y3SoloThickness_eff + 8; // maintain visual weight
            // Content radius equals stroke center (keep in sync with reset logic above)
            const contentR = infoR;
            const startOffsetDeg = 0; // start at top
            const items = headings.map((h, i) => {
              const start = startOffsetDeg + i * sector;
              const end = start + sector;
              const arc = { start, end };
              const trimmed = trim(arc, contentR);
              const mid = (trimmed.start + trimmed.end) / 2;
              const onClick = () => {
                setInfoSelected(h.id);
                setInfoRotation(-mid);
                if (onInfoSelect && selected) {
                  const keyMap = { key: 'keyInfo', syn: 'synopsis', out: 'outcomes', arb: 'arb', thr: 'threads' };
                  onInfoSelect(selected, keyMap[h.id] || 'keyInfo');
                }
              };
              return (
                <g key={h.id}>
                  <path d={arcPath(cx, cy, contentR, trimmed.start, trimmed.end)} stroke={infoStrokeFor(h.id)} strokeWidth={infoThick} strokeLinecap="butt" fill="none" style={{ cursor: 'pointer', transition: 'stroke 200ms ease' }} onClick={onClick} />
                  <path d={arcPath(cx, cy, contentR, trimmed.start, trimmed.end)} stroke="transparent" strokeWidth={infoThick + 16} fill="none" style={{ cursor: 'pointer' }} onClick={onClick} onMouseEnter={() => setInfoHovered(h.id)} onMouseLeave={() => setInfoHovered(null)} />
                  <ArcLabel id={`info-${h.id}`} cx={cx} cy={cy} r={contentR - 6} start={trimmed.start} end={trimmed.end} text={h.label} fontSize={11} fontWeight={infoSelected === h.id ? '700' : '600'} fill={infoLabelFillFor(h.id)} />
                </g>
              );
            });
            return items;
          })()}
        </g>
      )}

      {/* Programme ring (home view) — render outside main rotating group to keep timing in sync */}
      {!selected && (
        <g style={{
          transform: `rotate(${progRotation}deg)`,
          transformOrigin: `${cx}px ${cy}px`,
          transition: `transform ${isResetting ? resetDurMs : NORMAL_TRANS_MS}ms ${TRANS_EASE} ${PROG_TRANS_DELAY_MS}ms, opacity ${RESET_FADE_MS}ms ${TRANS_EASE} ${PROG_OPACITY_DELAY_MS}ms`,
          opacity: isResetting ? (progReappearing ? (progEnter ? 0.6 : 0) : 0.6) : 1,
          willChange: WILL_CHANGE,
          pointerEvents: (isResetting || isSpinning) ? 'none' : 'auto'
        }}>
          {(() => {
            const progThick = baseThickness + 10;
            // Place programme ring just inside Year 1 inner edge for a larger, less compressed radius
            const PROG_RING_INSET = 138; // px gap from Y1 inner edge to programme ring outer edge
            const y1InnerEdge = y1SoloR - baseThickness / 2; // inner boundary of Year 1 modules
            const progR = y1InnerEdge - PROG_RING_INSET - progThick / 2;
            const programColor = '#FDE047';
            const programHoverColor = '#FACC15';
            const programSelectedColor = '#F59E0B';
            const heads = [
              { id: 'prog-syn', label: 'Programme Synopsis' },
              { id: 'prog-thr', label: 'Studio Threads' },
              { id: 'prog-mlo', label: 'Programme Outcomes' },
            ];
            const sector = 360 / heads.length;
            return heads.map((h, i) => {
              const start = i * sector;
              const end = start + sector;
              const trimmed = trim({ start, end }, progR);
              const mid = (trimmed.start + trimmed.end) / 2;
              const stroke = (progSelected === h.id) ? programSelectedColor : (hovered === h.id ? programHoverColor : programColor);
              const onClick = () => {
                setProgRotation(-mid);
                setProgSelected(h.id);
                if (onInfoSelect) {
                  const keyMap = { 'prog-syn': 'synopsis', 'prog-thr': 'threads', 'prog-mlo': 'outcomes' };
                  onInfoSelect('PROGRAMME', keyMap[h.id]);
                }
              };
              const labelFill = progSelected
                ? (progSelected === h.id ? '#111827' : '#6b7280')
                : '#FFFFFF';
              return (
                <g key={h.id}>
                  <path d={arcPath(cx, cy, progR, trimmed.start, trimmed.end)} stroke={stroke} strokeWidth={progThick} strokeLinecap="butt" fill="none" style={{ cursor: 'pointer', transition: `stroke ${HOVER_TRANS_MS}ms ${TRANS_EASE}` }} onMouseEnter={() => setHovered(h.id)} onMouseLeave={() => setHovered(null)} onClick={onClick} />
                  <ArcLabel id={`prog-${h.id}`} cx={cx} cy={cy} r={progR - 4} start={trimmed.start} end={trimmed.end} text={h.label} fontSize={11} fontWeight="700" fill={labelFill} />
                </g>
              );
            });
          })()}
        </g>
      )}

      <g
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: `transform ${isResetting ? resetDurMs : NORMAL_TRANS_MS}ms ${TRANS_EASE}, opacity ${RESET_FADE_MS}ms ${TRANS_EASE}`, opacity: isResetting ? 0.6 : 1, willChange: WILL_CHANGE, pointerEvents: (isResetting || isSpinning) ? 'none' : 'auto' }}
        onMouseLeave={() => setHovered(null)}
      >
        {/* Year labels only (no semesters) */}
        <g style={fadeStyleY1}>
          <ArcLabel id="y1" cx={cx} cy={cy} r={year1LabelR} start={0} end={60} text={"Year 1"} fill="#000" fontSize={10} fontWeight="600" startOffset="0%" textAnchor="start" />
        </g>
        <g style={fadeStyleY2}>
          <ArcLabel id="y2" cx={cx} cy={cy} r={year2LabelR} start={0} end={60} text={"Year 2"} fill="#000" fontSize={10} fontWeight="600" startOffset="0%" textAnchor="start" />
        </g>
        <g style={fadeStyleY3}>
          <ArcLabel id="y3" cx={cx} cy={cy} r={year3LabelR} start={0} end={60} text={"Year 3"} fill="#000" fontSize={10} fontWeight="600" startOffset="0%" textAnchor="start" />
        </g>

        {/* Programme ring (home view) — rotates on click, fades when a module is selected */}
        {/* Counter-rotate by parent rotation so programme ring stays upright on initial view */}

        {/* Year 1 group (single ring per year; arcs sized by credits). Use uniform stroke width and soloR for placement */}
        <g style={fadeStyleY1}>
          {year1Arcs.map(a => {
            const r = y1SoloR; // place all Year 1 modules on the single solo ring
            const strokeW = baseThickness; // uniform thickness for all modules
            const arcTrim = a.trimmed || { start: a.start, end: a.end };
            return (
              <g key={a.id}>
                <path d={arcPath(cx, cy, r, arcTrim.start, arcTrim.end)} stroke={strokeFor(a.id)} strokeWidth={strokeW} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered(a.id)} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate(a.id, { start: a.start, end: a.end })} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
                <ArcLabel id={`lbl-${a.id}`} cx={cx} cy={cy} r={r - 4} start={arcTrim.start + 2} end={arcTrim.end - 2} text={a.name || a.id} fontWeight="700" fill={labelFillFor(a.id)} />
              </g>
            );
          })}
        </g>

        {/* Year 2 group (single ring sized by credits). Use uniform stroke width and effective solo radius */}
        <g style={fadeStyleY2}>
          {year2Arcs.map(a => {
            const r = y2SoloR_eff; // place all Year 2 modules on their solo ring
            const strokeW = baseThickness; // uniform thickness
            const arcTrim = a.trimmed || { start: a.start, end: a.end };
            return (
              <g key={a.id}>
                <path d={arcPath(cx, cy, r, arcTrim.start, arcTrim.end)} stroke={strokeFor(a.id)} strokeWidth={strokeW} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered(a.id)} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate(a.id, { start: a.start, end: a.end })} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
                <ArcLabel id={`lbl-${a.id}`} cx={cx} cy={cy} r={r - 4} start={arcTrim.start + 2} end={arcTrim.end - 2} text={a.name || a.id} fontWeight="700" fill={labelFillFor(a.id)} />
              </g>
            );
          })}
        </g>

        {/* Year 3 group (single ring sized by credits). Use uniform stroke width and effective solo radius */}
        <g style={fadeStyleY3}>
          {year3Arcs.map(a => {
            const r = y3SoloR_eff; // place all Year 3 modules on their solo ring
            const strokeW = baseThickness; // uniform thickness
            const arcTrim = a.trimmed || { start: a.start, end: a.end };
            return (
              <g key={a.id}>
                <path d={arcPath(cx, cy, r, arcTrim.start, arcTrim.end)} stroke={strokeFor(a.id)} strokeWidth={strokeW} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered(a.id)} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate(a.id, { start: a.start, end: a.end })} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
                <ArcLabel id={`lbl-${a.id}`} cx={cx} cy={cy} r={r - 4} start={arcTrim.start + 2} end={arcTrim.end - 2} text={a.name || a.id} fontWeight="700" fill={labelFillFor(a.id)} />
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}
