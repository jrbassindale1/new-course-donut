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

// Radial line between inner and outer radii at a given angle
const radialPath = (cx, cy, rInner, rOuter, angleDeg) => {
  const [ix, iy] = toXY(cx, cy, rInner, angleDeg);
  const [ox, oy] = toXY(cx, cy, rOuter, angleDeg);
  return `M ${ix} ${iy} L ${ox} ${oy}`;
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
export default function CompassChart({ width = 680, height = 680, padding = 16, colors, onSelect, onInfoSelect, resetSignal }) {
  const W = width;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;

  // Radii and thickness
  const baseThickness = 30; // thinner concurrent band thickness (~2/3 of previous)
  const gap = 8;            // space between bands (within a year)
  // Elements that extend beyond module outer edge
  const bandExtra = 24;     // px extra outward thickness for background bands
  const thinBand = 10;      // px – thin guide ring
  // Ensure the SVG viewBox always has enough breathing room so strokes don't clip.
  // The furthest outward element is max(bandExtra, thinBand). Add a small safety margin (3px).
  const PAD_SAFE = Math.max(bandExtra, thinBand) + 3;
  const PAD = Math.max(padding, PAD_SAFE);
  const outerR = Math.min(W, H) / 2 - PAD; // fixed outer radius with safe padding
  const bottomR = outerR - baseThickness / 2;  // center radius for bottom band stroke
  const topR = outerR - baseThickness - gap - baseThickness / 2; // center radius for top band stroke
  const soloThickness = baseThickness * 2 + gap; // double thickness + gap to span both
  // Center the solo band so it spans both concurrent bands plus the gap
  const soloR = outerR - (soloThickness / 2);

  // Thin outer guide ring just outside modules
  // Place thin ring so its inner edge touches the module outer edge
  const thinOffset = 0;
  const thinR = outerR + thinBand / 2;   // inner edge = outerR

  // Thin inner guide ring (Year 2) just inside modules (between Y1 and Y2)
  const innerEdge = (topR - baseThickness / 2);               // inner boundary of Y1 modules
  const ringGap = 6;                                          // desired radial gap between Y1 inner edge and Y2 ring
  const innerThinR = innerEdge - ringGap - thinBand / 2;      // ring outer edge = innerEdge - ringGap

  // Year 2 inner bands (two concurrent rings + solo segment in S1)
  // Make Y2 modules butt up against the inner thin ring (no gap to the ring)
  const y2BottomR = innerThinR - (thinBand / 2 + baseThickness / 2);
  const y2TopR = y2BottomR - baseThickness - gap;
  const y2SoloThickness = baseThickness * 2 + gap;
  const y2SoloR = (y2BottomR + y2TopR) / 2;

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
  const hoverOutlineColor = hoverColor;  // legacy: match hover for any outlines
  const hoverOutlineW = 2;              // px

  // Base angles (clockwise, 0 at top)
  const A0 = {
    // Semester 1 (0°–180°)
    aea: { start: 0, end: 90 },            // first 90° (concurrent band A)
    cap: { start: 0, end: 90 },            // first 90° (concurrent band B)
    pathway: { start: 90, end: 180 },      // second 90° (solo, thick)
    // Semester 2 (180°–360°)
    explore: { start: 180, end: 360 },     // full S2 on band A
    zc: { start: 180, end: 360 },          // full S2 on band B
  };

  // Tangential gap between modules (px along the arc length)
  const MODULE_GAP_PX = 8;
  const gapAngle = (r) => (MODULE_GAP_PX / (2 * Math.PI * r)) * 360;
  const trim = (arc, r) => {
    const g = gapAngle(r) / 2;
    return { start: arc.start + g, end: arc.end - g };
  };
  // Custom trim that allows removing the gap at either end
  const trimCustom = (arc, r, trimStart = true, trimEnd = true) => {
    const g = gapAngle(r) / 2;
    return { start: arc.start + (trimStart ? g : 0), end: arc.end - (trimEnd ? g : 0) };
  };
  // Trim using standard start gap for a ring, but a custom end gap (in degrees)
  const trimWithCustomEndGap = (arc, r, endGapDeg) => {
    const gStart = gapAngle(r) / 2;
    return { start: arc.start + gStart, end: arc.end - endGapDeg };
  };
  // Fine-tune the shared end gap between Thesis (outer) and Ecology (inner)
  const ECO_EXTRA_END_GAP_DEG = 0.8; // add ~0.8° more space between end caps
  const A = {
    aea: trim(A0.aea, topR),
    cap: trim(A0.cap, bottomR),
    pathway: trim(A0.pathway, soloR),
    explore: trim(A0.explore, topR),
    zc: trim(A0.zc, bottomR),
  };

  // Year 2 angles (same layout logic as Year 1)
  const A2_0 = {
    fa: { start: 0, end: 90 },                // Future Architectural Practice (S1 concurrent)
    manifesto: { start: 0, end: 90 },         // Critical Manifesto (S1 concurrent)
    thesisSolo: { start: 90, end: 180 },      // S1 solo (Design Thesis)
    thesisS2: { start: 180, end: 360 },       // S2 concurrent band A (Design Thesis)
    eco: { start: 180, end: 360 },            // S2 concurrent band B (Ecological)
  };
  const A2 = {
    fa: trim(A2_0.fa, y2TopR),
    manifesto: trim(A2_0.manifesto, y2BottomR),
    // Join Design Thesis S1 and S2 visually: remove the shared gap at 180°
    thesisSolo: trimCustom(A2_0.thesisSolo, y2SoloR, true, false),   // keep start gap at 90°, no gap at 180°
    // Note: Thesis S2 is drawn on the outer concurrent band (y2BottomR), so compute gap using that radius
    thesisS2: trimCustom(A2_0.thesisS2, y2BottomR, false, true),     // no gap at 180°, keep gap at 360°
    // Ecology (inner) keeps standard start gap; increase end gap to align + slightly separate from Thesis
    eco: trimWithCustomEndGap(A2_0.eco, y2TopR, gapAngle(y2BottomR) / 2 + ECO_EXTRA_END_GAP_DEG),
  };


  // Local selection + rotation state
  const [selected, setSelected] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);
  // Initial view: rotate Y1+Y2 segments counter-clockwise by 45°
  const [rotation, setRotation] = React.useState(-45);
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
    const alreadyNeutral = (selected === null && rotation === -45 && infoRotation === 0 && progRotation === 0);
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
    setRotation(-45);
    setInfoRotation(0);
    setInfoSelected(null);
    setInfoHovered(null);
    setProgRotation(0);
    setProgSelected(null);
    const t = setTimeout(() => setIsResetting(false), dur);
    return () => { clearTimeout(t); clearTimeout(enterTimer); };
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

  const strokeFor = (id, _color) => {
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
  const selectedYear = selected ? (year1Ids.has(selected) ? 1 : (year2Ids.has(selected) ? 2 : null)) : null;
  const showYear1 = !selectedYear || selectedYear === 1;
  const showYear2 = !selectedYear || selectedYear === 2;
  const expandY2 = selectedYear === 2;
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
  // Year 1 background metrics
  const y1BgInner = soloR - soloThickness / 2;
  const y1BgThick = soloThickness + bandExtra;
  const y1BgR = y1BgInner + y1BgThick / 2;
  const y1BgOuter = y1BgInner + y1BgThick;
  // Compute an inward shift for Year 2 modules (only when not expanded)
  // so the Year 2 grey background has the same thickness as Year 1
  // and still leaves a visible yellow gap before the Year 2 ring.
  let y2InwardShift = 0;
  if (!expandY2) {
    const y2RingInnerEdge = innerThinR - thinBand / 2;   // inner edge of thin ring
    const capOuter = y2RingInnerEdge - 2;                // stop a little before the ring
    const desiredY2BgThick = y2SoloThickness + bandExtra; // match Y1 background thickness visually
    const targetBgInner = capOuter - desiredY2BgThick;
    const currentBgInner = y2SoloR - y2SoloThickness / 2;
    y2InwardShift = Math.max(0, currentBgInner - targetBgInner);
  }

  // Effective Year 2 radii using the computed shift
  const y2TopR_eff = expandY2 ? topR : (y2TopR - y2InwardShift);
  const y2BottomR_eff = expandY2 ? bottomR : (y2BottomR - y2InwardShift);
  const y2SoloR_eff = expandY2 ? soloR : (y2SoloR - y2InwardShift);
  // Combined Design Thesis arc (join S1 90°–180° and S2 180°–360°)
  const thesisCombinedArc = { start: A2.thesisSolo.start, end: A2.thesisS2.end };
  const thesisCombinedMidR = (y2BottomR_eff + y2SoloR_eff) / 2;
  const y2SoloThickness_eff = expandY2 ? soloThickness : y2SoloThickness;

  // Year 2 background metrics (based on effective radii)
  const y2BgInner = y2SoloR_eff - y2SoloThickness_eff / 2;
  let y2BgThick = y2SoloThickness_eff + bandExtra;
  let y2BgOuter = y2BgInner + y2BgThick;
  if (!expandY2) {
    const capOuter = (innerThinR - thinBand / 2) - 2;
    if (y2BgOuter > capOuter) {
      y2BgOuter = capOuter;
      y2BgThick = y2BgOuter - y2BgInner;
    }
  }
  const y2BgR = y2BgInner + y2BgThick / 2;

  // Year label radii positioned near outer edge of background bands
  const labelInset = 14; // px inside the band outer edge (bring labels slightly inward)
  const year1LabelR = y1BgOuter - labelInset;
  const year2LabelR = y2BgOuter - labelInset;

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
      const contentR = y2SoloR - 10; // must match Info Wheel content radius
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
  }, [selected]);

  // Fade styles for year groups
  const fadeStyleY1 = { opacity: showYear1 ? 1 : 0, transition: 'opacity 450ms ease', pointerEvents: showYear1 ? 'auto' : 'none' };
  const fadeStyleY2 = { opacity: showYear2 ? 1 : 0, transition: 'opacity 450ms ease', pointerEvents: showYear2 ? 'auto' : 'none' };

  return (
    <svg className="compass-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Programme overview compass">
      <defs>
        {/* Clip inner half of strokes to simulate inner highlight border on hover */}
        <clipPath id="clip-inner-solo"><circle cx={cx} cy={cy} r={soloR - soloThickness/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-top"><circle cx={cx} cy={cy} r={topR - baseThickness/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-bottom"><circle cx={cx} cy={cy} r={bottomR - baseThickness/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-y2solo"><circle cx={cx} cy={cy} r={y2SoloR - y2SoloThickness/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-y2top"><circle cx={cx} cy={cy} r={y2TopR - baseThickness/2 + 0.5} /></clipPath>
        <clipPath id="clip-inner-y2bottom"><circle cx={cx} cy={cy} r={y2BottomR - baseThickness/2 + 0.5} /></clipPath>
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
      </g>
      {/* Stationary thin outer guide ring (continuous) */}
      <g>
        <circle cx={cx} cy={cy} r={thinR} stroke="#ccd0d8" strokeWidth={thinBand} fill="none" />
      </g>

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
            const infoR = y2SoloR;
            const infoThick = y2SoloThickness;
            // Content radius is moved inward by 10px
            const contentR = infoR - 10;
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
            const progThick = baseThickness + 30;
            const innerGap = gap + 40;
            const progR = y2TopR - baseThickness / 2 - innerGap - progThick / 2;
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
        {/* Year + semester labels (top: S1, bottom: S2) */}
        <g style={fadeStyleY1}>
          <ArcLabel id="y1-s1" cx={cx} cy={cy} r={year1LabelR} start={0} end={60} text={"Year 1 — Semester 1 ▸"} fill="#000" fontSize={10} fontWeight="500" startOffset="0%" textAnchor="start" />
          <ArcLabel id="y1-s2" cx={cx} cy={cy} r={year1LabelR} start={180} end={240} text={"Year 1 — Semester 2 ▸"} fill="#000" fontSize={10} fontWeight="500" startOffset="0%" textAnchor="start" />
        </g>
        <g style={fadeStyleY2}>
          <ArcLabel id="y2-s1" cx={cx} cy={cy} r={year2LabelR} start={0} end={60} text={"Year 2 — Semester 1 ▸"} fill="#000" fontSize={10} fontWeight="500" startOffset="0%" textAnchor="start" />
          <ArcLabel id="y2-s2" cx={cx} cy={cy} r={year2LabelR} start={180} end={240} text={"Year 2 — Semester 2 ▸"} fill="#000" fontSize={10} fontWeight="500" startOffset="0%" textAnchor="start" />
        </g>

        {/* Programme ring (home view) — rotates on click, fades when a module is selected */}
        {/* Counter-rotate by parent rotation so programme ring stays upright on initial view */}

        {/* Year 1 group (fades when hidden) */}
        <g style={fadeStyleY1}>
          {/* Solo thick segment (Pathway) with square ends */}
          <path
            d={arcPath(cx, cy, soloR, A.pathway.start, A.pathway.end)}
            stroke={strokeFor('UBLL46-30-3', C.pathway)}
            strokeWidth={soloThickness}
            strokeLinecap="butt"
            fill="none"
            onMouseEnter={() => setHovered('UBLL46-30-3')}
            onMouseLeave={() => setHovered(null)}
            onClick={selectAndRotate('UBLL46-30-3', A.pathway)}
            style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }}
          />
          {/* Hover outline removed to avoid Chrome edge line */}
          <ArcLabel id="pathway-label" cx={cx} cy={cy} r={soloR - 4} fill={labelFillFor('UBLL46-30-3')}
                    start={A.pathway.start + 2} end={A.pathway.end - 2}
                    text="Pathway Studio / Practice Studio (PT/DA)" fontWeight="700" />

        {/* Top band: AEA (90°), spacer (90° as empty), Exploratory (180°) */}
          <path d={arcPath(cx, cy, topR, A.aea.start, A.aea.end)} stroke={strokeFor('UBLL48-15-3', C.aea)} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL48-15-3')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL48-15-3', A.aea)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="aea-label" cx={cx} cy={cy} r={topR - 4} fill={labelFillFor('UBLL48-15-3')} start={A.aea.start + 2} end={A.aea.end - 2} text="Architectural Ethics & Agency" fontWeight="700" />

          <path d={arcPath(cx, cy, topR, A.explore.start, A.explore.end)} stroke={strokeFor('UBLL47-30-3', C.explore)} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL47-30-3')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL47-30-3', A.explore)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="explore-label" cx={cx} cy={cy} r={topR - 4} fill={labelFillFor('UBLL47-30-3')} start={A.explore.start + 2} end={A.explore.end - 2} text="Exploratory Design Studio" fontWeight="700" />

        {/* Bottom band: CAP (90°), spacer (90°), Zero Carbon (180°) */}
          <path d={arcPath(cx, cy, bottomR, A.cap.start, A.cap.end)} stroke={strokeFor('UBLL49-15-3', C.cap)} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL49-15-3')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL49-15-3', A.cap)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="cap-label" cx={cx} cy={cy} r={bottomR - 4} fill={labelFillFor('UBLL49-15-3')} start={A.cap.start + 2} end={A.cap.end - 2} text="Critical Architectural Practices" fontWeight="700" />

          <path d={arcPath(cx, cy, bottomR, A.zc.start, A.zc.end)} stroke={strokeFor('UBLL45-30-3', C.zc)} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL45-30-3')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL45-30-3', A.zc)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="zc-label" cx={cx} cy={cy} r={bottomR - 4} fill={labelFillFor('UBLL45-30-3')} start={A.zc.start + 2} end={A.zc.end - 2} text="Zero Carbon Design & Innovation" fontWeight="700" />
        </g>

        {/* Year 2 group (fades when hidden) */}
        <g style={fadeStyleY2}>
          {/* YEAR 2: Solo segment (Design Thesis) in S1 */}
          <path
            d={arcPath(cx, cy, y2SoloR_eff, A2.thesisSolo.start, A2.thesisSolo.end)}
            stroke={strokeFor('UBLL4A-60-M', '#999')}
            strokeWidth={y2SoloThickness_eff}
            strokeLinecap="butt"
            fill="none"
            onMouseEnter={() => setHovered('UBLL4A-60-M')}
            onMouseLeave={() => setHovered(null)}
            onClick={selectAndRotate('UBLL4A-60-M', thesisCombinedArc)}
            style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }}
          />
          {/* Hover outline removed for Design Thesis (solo) */}
          {/* Thesis label only on the wider S2 arc (below) */}

        {/* YEAR 2: Top band (FA in S1, Thesis in S2) */}
          <path d={arcPath(cx, cy, y2TopR_eff, A2.fa.start, A2.fa.end)} stroke={strokeFor('UBLL4B-15-M', '#999')} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL4B-15-M')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL4B-15-M', A2.fa)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="y2-fa" cx={cx} cy={cy} r={y2TopR_eff - 4} fill={labelFillFor('UBLL4B-15-M')} start={A2.fa.start + 2} end={A2.fa.end - 2} text="Future Architectural Practice" fontWeight="700" />

          {/* Swap: Design Thesis goes on the outer concurrent band (use y2BottomR_eff) */}
          <path d={arcPath(cx, cy, y2BottomR_eff, A2.thesisS2.start, A2.thesisS2.end)} stroke={strokeFor('UBLL4A-60-M', '#999')} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL4A-60-M')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL4A-60-M', thesisCombinedArc)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          {/* Combined Design Thesis label positioned midway between bands and spanning the full joined arc */}
          <ArcLabel id="y2-thesis-combined" cx={cx} cy={cy} r={thesisCombinedMidR + 5} fill={labelFillFor('UBLL4A-60-M')} start={A2.thesisSolo.start + 2} end={A2.thesisS2.end - 2} text="Design Thesis" fontWeight="700" />

        {/* YEAR 2: Bottom band (Manifesto in S1, Ecology in S2) */}
          <path d={arcPath(cx, cy, y2BottomR_eff, A2.manifesto.start, A2.manifesto.end)} stroke={strokeFor('UBLL4C-15-M', '#999')} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL4C-15-M')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL4C-15-M', A2.manifesto)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="y2-manifesto" cx={cx} cy={cy} r={y2BottomR_eff - 4} fill={labelFillFor('UBLL4C-15-M')} start={A2.manifesto.start + 2} end={A2.manifesto.end - 2} text="Critical Manifesto" fontWeight="700" />

          {/* Swap: Ecology moves to inner concurrent band (use y2TopR_eff) */}
          <path d={arcPath(cx, cy, y2TopR_eff, A2.eco.start, A2.eco.end)} stroke={strokeFor('UBLL4F-30-M', '#999')} strokeWidth={baseThickness} strokeLinecap="butt" fill="none" onMouseEnter={() => setHovered('UBLL4F-30-M')} onMouseLeave={() => setHovered(null)} onClick={selectAndRotate('UBLL4F-30-M', A2.eco)} style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }} />
          {/* Hover outline removed */}
          <ArcLabel id="y2-eco" cx={cx} cy={cy} r={y2TopR_eff - 4} fill={labelFillFor('UBLL4F-30-M')} start={A2.eco.start + 2} end={A2.eco.end - 2} text="Ecological & Regenerative Approaches" fontWeight="700" />
        </g>
      </g>
    </svg>
  );
}
