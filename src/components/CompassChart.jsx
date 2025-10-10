import React from "react";
import moduleInfo from "../data/moduleInfo.json";

const RAD = Math.PI / 180;

const toXY = (cx, cy, r, angleDeg) => {
  const angle = (angleDeg - 90) * RAD;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
};

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const [sx, sy] = toXY(cx, cy, r, startDeg);
  const [ex, ey] = toXY(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) % 360 > 180 ? 1 : 0;
  const sweep = endDeg >= startDeg ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`;
};

const ArcLabel = ({
  id,
  cx,
  cy,
  r,
  start,
  end,
  text,
  fontSize = 13,
  fontWeight = "600",
  fill = "#111827",
  startOffset = "50%",
  textAnchor = "middle",
}) => {
  if (!text) return null;
  const pathId = `${id}-path`;
  const d = arcPath(cx, cy, r, start, end);
  return (
    <g>
      <defs>
        <path id={pathId} d={d} />
      </defs>
      <text fill={fill} fontSize={fontSize} fontWeight={fontWeight} style={{ pointerEvents: "none" }}>
        <textPath href={`#${pathId}`} startOffset={startOffset} textAnchor={textAnchor}>
          {text}
        </textPath>
      </text>
    </g>
  );
};

const THEME_COLORS = {
  Studio: "#FDE047",
  "Technology and Environment": "#FACC15",
  Humanities: "#EAB308",
  "Professional Practice and Behaviours": "#F59E0B",
};

const THEME_ORDER = ["Studio", "Technology and Environment", "Humanities", "Professional Practice and Behaviours"];

const MODULE_GAP_PX = 5;

// Quick knobs for the chart layout. Edit the numbers below to see how the diagram behaves.
const CHART_TUNING = {
  canvasSize: 720,             // default width/height (px) when no props are passed in
  baseReferenceSize: 1000,      // the chart aims for this size before scaling down
  minScale: 0.,               // smallest scale factor allowed
  maxScale: 1,                 // largest scale factor allowed
  ringThickness: 60,           // thickness of each module ring at scale 1 (px)
  ringGap: 35,                 // gap between module rings at scale 1 (px)
  backgroundExtra: 25,         // extra thickness added to the grey year band (px)
  paddingExtra: 0,            // extra breathing room between chart and edge (px)
  yearLabelOffset: 25,          // push year labels out (+) or pull them in (-) relative to grey band centre (px)
  yearLabelArcStart: -70,      // where the year labels begin (degrees, before the -90° rotation)
  yearLabelArcEnd: 70,        // where the year labels end (degrees)
  yearLabelFontBase: 14,       // base font size for year labels
  yearLabelFontMin: 11,        // minimum font size for year labels
  moduleLabelSingleOuter: 0.14,   // single-line labels sit this fraction of ring thickness outside the ring
  moduleLabelSingleInner: 0.18,   // safety pull for single-line labels (used if needed)
  moduleLabelDoubleOuter: 0.08,   // outer offset for the first line of a two-line label (fraction of thickness)
  moduleLabelDoubleInner: 0.29,   // inner offset for the second line (fraction of thickness)
  moduleLabelArcInset: 150,         // trim label arcs by this many degrees on each end
};

const clamp = (value, min = 0, max = 255) => Math.max(min, Math.min(max, value));

const hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  const expanded = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return [r, g, b];
};

const rgbToHex = (r, g, b) =>
  `#${[r, g, b]
    .map((value) => clamp(Math.round(value)).toString(16).padStart(2, "0"))
    .join("")}`;

const lighten = (hex, amount = 0.12) => {
  try {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  } catch {
    return hex;
  }
};

const darken = (hex, amount = 0.2) => {
  try {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
  } catch {
    return hex;
  }
};

const getModuleCredits = (meta) => {
  if (!meta || !Array.isArray(meta.keyInfo)) return 0;
  const creditEntry = meta.keyInfo.find((entry) => entry.label === "Credits");
  const value = creditEntry ? Number(creditEntry.value) : 0;
  return Number.isFinite(value) ? value : 0;
};

const getModuleYear = (id) => {
  const raw = moduleInfo[id];
  if (!raw) return null;
  const value = raw["year of study"] || raw.year || raw?.meta?.year;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const idsByYear = (year) => Object.keys(moduleInfo).filter((id) => getModuleYear(id) === year);

const getSemester = (id) => {
  const info = moduleInfo[id];
  if (!info || !Array.isArray(info.keyInfo)) return 99;
  const entry = info.keyInfo.find((item) => item.label === "Semester");
  const parsed = Number(entry?.value);
  return Number.isFinite(parsed) ? parsed : 99;
};

const sortYearIds = (ids) =>
  ids
    .slice()
    .sort((a, b) => {
      const themeA = moduleInfo[a]?.moduleTheme;
      const themeB = moduleInfo[b]?.moduleTheme;
      const orderA = THEME_ORDER.indexOf(themeA);
      const orderB = THEME_ORDER.indexOf(themeB);
      if (orderA !== orderB) {
        const safeOrderA = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA;
        const safeOrderB = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB;
        if (safeOrderA !== safeOrderB) return safeOrderA - safeOrderB;
      }
      const semesterA = getSemester(a);
      const semesterB = getSemester(b);
      if (semesterA !== semesterB) return semesterA - semesterB;
      const nameA = moduleInfo[a]?.moduleName || a;
      const nameB = moduleInfo[b]?.moduleName || b;
      return String(nameA).localeCompare(String(nameB));
    });

const gapAngle = (radius) => {
  if (!radius || radius <= 0) return 0;
  return (MODULE_GAP_PX / (2 * Math.PI * radius)) * 360;
};

const buildYearArcs = (ids, radius) => {
  if (!ids || !ids.length) return [];
  const modules = ids.map((id) => {
    const meta = moduleInfo[id] || {};
    return {
      id,
      name: meta.moduleName || id,
      credits: getModuleCredits(meta) || 0,
    };
  });

  const totalCredits = modules.reduce((sum, module) => sum + module.credits, 0) || 120;
  let cursor = 0;
  const gap = gapAngle(radius);

  return modules.map((module) => {
    const sweep = ((module.credits || 0) / totalCredits) * 360;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end;
    const trimmedStart = start + gap;
    const trimmedEnd = end - gap;

    return {
      id: module.id,
      name: module.name,
      start,
      end,
      trimmed:
        trimmedEnd > trimmedStart
          ? { start: trimmedStart, end: trimmedEnd }
          : { start, end },
    };
  });
};

const getArcMidpoint = (arc) => {
  if (!arc) return 0;
  const source = arc.trimmed || arc;
  const start = Number.isFinite(source.start) ? source.start : 0;
  const end = Number.isFinite(source.end) ? source.end : start;
  const mid = start + (end - start) / 2;
  const normalised = ((mid % 360) + 360) % 360;
  return normalised;
};

const splitLabel = (text) => {
  if (!text) return [""];
  const normalised = String(text).replace(/\s+/g, " ").trim();
  if (normalised.length <= 18) return [normalised];
  const separators = [" — ", " - ", ": ", ", "];
  for (const separator of separators) {
    const index = normalised.lastIndexOf(separator, 28);
    if (index > 8) {
      return [normalised.slice(0, index).trim(), normalised.slice(index + separator.length).trim()];
    }
  }
  let breakPoint = normalised.lastIndexOf(" ", 25);
  if (breakPoint < 10) breakPoint = normalised.indexOf(" ", 25);
  if (breakPoint === -1) return [normalised];
  return [normalised.slice(0, breakPoint).trim(), normalised.slice(breakPoint + 1).trim()];
};

const renderYearBand = ({
  arcs,
  cx,
  cy,
  radius,
  strokeWidth,
  onModuleClick,
  onModuleEnter,
  onModuleLeave,
  strokeFor,
  labelFillFor,
  scale = 1,
  primaryFontFloor = 11,
  secondaryFontFloor = 7,
}) => {
  if (!radius || radius <= 0 || !arcs || !arcs.length) return null;
  return arcs.map((arc) => {
    const arcTrim = arc.trimmed || { start: arc.start, end: arc.end };
    const lines = splitLabel(arc.name);
    const hasTwoLines = lines.length > 1 && lines[1];
    const outerOffset = hasTwoLines ? strokeWidth * 0.08 : strokeWidth * 0.14;
    const innerOffset = hasTwoLines ? strokeWidth * 0.29 : strokeWidth * 0.18;
    const labelOuterR = radius + outerOffset;
    const labelInnerR = radius - innerOffset;
    const title = moduleInfo[arc.id]?.moduleName || arc.id;
    const code = arc.id;
    const primaryFontSize = Math.max(primaryFontFloor, 13 * scale);
    const secondaryFontSize = Math.max(secondaryFontFloor, 10 * scale);

    const handleKeyDown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onModuleClick(arc.id);
      }
    };

    return (
      <g key={arc.id}>
        <path
          d={arcPath(cx, cy, radius, arcTrim.start, arcTrim.end)}
          stroke={strokeFor(arc.id)}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          fill="none"
          role="button"
          tabIndex={0}
          aria-label={`${title} (${code}) — view synopsis`}
          onClick={() => onModuleClick(arc.id)}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => onModuleEnter(arc.id)}
          onMouseLeave={() => onModuleLeave()}
          onFocus={() => onModuleEnter(arc.id)}
          onBlur={() => onModuleLeave()}
          style={{ cursor: "pointer", transition: "stroke 200ms ease", outline: "none" }}
        />
        <title>{`${title} (${code})`}</title>
        <ArcLabel
          id={`label-primary-${arc.id}`}
          cx={cx}
          cy={cy}
          r={labelOuterR}
          start={arcTrim.start}
          end={arcTrim.end}
          text={lines[0]}
          fill={labelFillFor(arc.id)}
          fontSize={primaryFontSize}
        />
        {hasTwoLines && (
          <ArcLabel
            id={`label-secondary-${arc.id}`}
            cx={cx}
            cy={cy}
            r={labelInnerR}
            start={arcTrim.start}
            end={arcTrim.end}
            text={lines[1]}
            fill={labelFillFor(arc.id)}
            fontSize={secondaryFontSize}
          />
        )}
      </g>
    );
  });
};

export default function CompassChart({
  width = CHART_TUNING.canvasSize,
  height = CHART_TUNING.canvasSize,
  padding = 6,
  colors,
  onInfoSelect,
  resetSignal,
}) {
  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const baseSize = CHART_TUNING.baseReferenceSize;
  const scale = Math.max(
    CHART_TUNING.minScale,
    Math.min(minDim / baseSize, CHART_TUNING.maxScale),
  );
  const ringThickness = CHART_TUNING.ringThickness * scale;
  const ringGap = CHART_TUNING.ringGap * scale;
  const backgroundStroke = ringThickness + CHART_TUNING.backgroundExtra * scale;
  const safePadding = Math.max(padding, backgroundStroke / 2 + CHART_TUNING.paddingExtra * scale);
  const availableRadius = Math.max(0, minDim / 2 - safePadding);

  const year1Outer = Math.max(0, availableRadius);
  const year1Inner = Math.max(0, year1Outer - ringThickness);
  const year1Radius = (year1Outer + year1Inner) / 2;

  const year2Outer = Math.max(0, year1Inner - ringGap);
  const year2Inner = Math.max(0, year2Outer - ringThickness);
  const year2Radius = (year2Outer + year2Inner) / 2;

  const year3Outer = Math.max(0, year2Inner - ringGap);
  const year3Inner = Math.max(0, year3Outer - ringThickness);
  const year3Radius = (year3Outer + year3Inner) / 2;

  const year1ModuleInner = year1Inner;
  const year2ModuleInner = year2Inner;
  const year3ModuleInner = year3Inner;

  const year1BgRadius = Math.max(0, year1ModuleInner + backgroundStroke / 2);
  const year2BgRadius = Math.max(0, year2ModuleInner + backgroundStroke / 2);
  const year3BgRadius = Math.max(0, year3ModuleInner + backgroundStroke / 2);
  const yearLabelRadiusOffset = CHART_TUNING.yearLabelOffset * scale;
  const year1LabelRadius = Math.max(0, year1BgRadius + yearLabelRadiusOffset);
  const year2LabelRadius = Math.max(0, year2BgRadius + yearLabelRadiusOffset);
  const year3LabelRadius = Math.max(0, year3BgRadius + yearLabelRadiusOffset);

  const [activeModule, setActiveModule] = React.useState(null);
  const [hoveredModule, setHoveredModule] = React.useState(null);
  const [isPhoneViewport, setIsPhoneViewport] = React.useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(max-width: 430px)").matches;
  });

  React.useEffect(() => {
    setActiveModule(null);
    setHoveredModule(null);
  }, [resetSignal]);

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(max-width: 430px)");
    const handleChange = (event) => setIsPhoneViewport(event.matches);
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", handleChange);
    } else if (typeof query.addListener === "function") {
      query.addListener(handleChange);
    }
    setIsPhoneViewport(query.matches);
    return () => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", handleChange);
      } else if (typeof query.removeListener === "function") {
        query.removeListener(handleChange);
      }
    };
  }, []);

  const primaryFontFloor = isPhoneViewport ? 5.5 : 12;
  const secondaryFontFloor = isPhoneViewport ? 5.5 : 12;
  const yearLabelFloor = isPhoneViewport ? Math.max(7.5, CHART_TUNING.yearLabelFontMin - 4.5) : CHART_TUNING.yearLabelFontMin;
  const yearLabelFontSize = Math.max(yearLabelFloor, CHART_TUNING.yearLabelFontBase * scale);

  const themeColors = colors && Object.keys(colors).length ? colors : THEME_COLORS;
  const fallbackColor = "#94a3b8";

  const colorForModule = (id) => {
    const theme = moduleInfo[id]?.moduleTheme;
    return (theme && themeColors[theme]) || fallbackColor;
  };

  const strokeFor = (id) => {
    const base = colorForModule(id);
    if (activeModule === id) return darken(base, 0.25);
    if (hoveredModule === id) return lighten(base, 0.1);
    return base;
  };

  const labelFillFor = (id) => (activeModule === id ? "#0f172a" : "#111827");

  const handleModuleClick = (id) => {
    setActiveModule(id);
    if (typeof onInfoSelect === "function") {
      const payload = {
        moduleId: id,
        intent: "synopsis",
        color: colorForModule(id),
      };
      onInfoSelect(payload);
    }
  };

  const handleModuleEnter = (id) => setHoveredModule(id);
  const handleModuleLeave = () => setHoveredModule(null);

  const year1Ids = sortYearIds(idsByYear(1));
  const year2Ids = sortYearIds(idsByYear(2));
  const year3Ids = sortYearIds(idsByYear(3));

  const year1Arcs = buildYearArcs(year1Ids, year1Radius);
  const year2Arcs = buildYearArcs(year2Ids, year2Radius);
  const year3Arcs = buildYearArcs(year3Ids, year3Radius);

  const arcsById = React.useMemo(() => {
    const map = {};
    for (const arc of [...year1Arcs, ...year2Arcs, ...year3Arcs]) {
      map[arc.id] = arc;
    }
    return map;
  }, [year1Arcs, year2Arcs, year3Arcs]);

  const activeArc = activeModule ? arcsById[activeModule] : null;
  const baseRotation = -90;
  const rotationDeg = activeArc ? 90 - getArcMidpoint(activeArc) : 0;

  return (
    <svg
      className="compass-svg"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Programme overview compass"
    >
      <g transform={`rotate(${baseRotation} ${cx} ${cy})`}>
        <g
          className="compass-rotation"
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: "view-box",
          }}
        >
          <g>
            <circle cx={cx} cy={cy} r={Math.max(0, year1BgRadius)} stroke="#ffffff" strokeWidth={backgroundStroke} fill="none" opacity={0.9} />
            <circle cx={cx} cy={cy} r={Math.max(0, year2BgRadius)} stroke="#ffffff" strokeWidth={backgroundStroke} fill="none" opacity={0.9} />
            <circle cx={cx} cy={cy} r={Math.max(0, year3BgRadius)} stroke="#ffffff" strokeWidth={backgroundStroke} fill="none" opacity={0.9} />
          </g>

          <g>
            {renderYearBand({
              arcs: year1Arcs,
              cx,
              cy,
              radius: year1Radius,
              strokeWidth: ringThickness,
              onModuleClick: handleModuleClick,
              onModuleEnter: handleModuleEnter,
              onModuleLeave: handleModuleLeave,
              strokeFor,
              labelFillFor,
              scale,
              primaryFontFloor,
              secondaryFontFloor,
            })}
            {renderYearBand({
              arcs: year2Arcs,
              cx,
              cy,
              radius: year2Radius,
              strokeWidth: ringThickness,
              onModuleClick: handleModuleClick,
              onModuleEnter: handleModuleEnter,
              onModuleLeave: handleModuleLeave,
              strokeFor,
              labelFillFor,
              scale,
              primaryFontFloor,
              secondaryFontFloor,
            })}
            {renderYearBand({
              arcs: year3Arcs,
              cx,
              cy,
              radius: year3Radius,
              strokeWidth: ringThickness,
              onModuleClick: handleModuleClick,
              onModuleEnter: handleModuleEnter,
              onModuleLeave: handleModuleLeave,
              strokeFor,
              labelFillFor,
              scale,
              primaryFontFloor,
              secondaryFontFloor,
            })}
          </g>

          <g>
            <ArcLabel
              id="year-1-label"
              cx={cx}
              cy={cy}
              r={year1LabelRadius}
              start={CHART_TUNING.yearLabelArcStart}
              end={CHART_TUNING.yearLabelArcEnd}
              text="Year 1"
              fontSize={yearLabelFontSize}
              fontWeight="600"
              startOffset="50%"
              textAnchor="left"
            />
            <ArcLabel
              id="year-2-label"
              cx={cx}
              cy={cy}
              r={year2LabelRadius}
              start={CHART_TUNING.yearLabelArcStart}
              end={CHART_TUNING.yearLabelArcEnd}
              text="Year 2"
              fontSize={yearLabelFontSize}
              fontWeight="600"
              startOffset="50%"
              textAnchor="left"
            />
            <ArcLabel
              id="year-3-label"
              cx={cx}
              cy={cy}
              r={year3LabelRadius}
              start={CHART_TUNING.yearLabelArcStart}
              end={CHART_TUNING.yearLabelArcEnd}
              text="Year 3"
              fontSize={yearLabelFontSize}
              fontWeight="600"
              startOffset="50%"
              textAnchor="left"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
