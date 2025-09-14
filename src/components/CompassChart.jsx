import React from "react";
import moduleInfo from "../data/moduleInfo.json";

const RAD = Math.PI / 180;
const toXY = (cx, cy, r, angleDeg) => {
  const a = (angleDeg - 90) * RAD;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const [sx, sy] = toXY(cx, cy, r, startDeg);
  const [ex, ey] = toXY(cx, cy, r, endDeg);
  const largeArc = Math.abs(endDeg - startDeg) % 360 > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweep} ${ex} ${ey}`;
};

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

export default function CompassChart({ width = 680, height = 680, padding = 16 }) {
  const W = width;
  const H = height;
  const cx = W / 2;
  const cy = H / 2;

  const ringThickness = 30;
  const ringGap = 10;
  const outerR = Math.min(W, H) / 2 - padding;
  const yearRadii = [0, 1, 2].map(i => outerR - ringThickness / 2 - i * (ringThickness + ringGap));

  const yearModules = {
    1: ['Y1DES40', 'Y1HIST20', 'Y1TECH60'],
    2: ['Y2DES40', 'Y2PRA20', 'Y2SUS60'],
    3: ['UBLL46-30-3', 'UBLL47-30-3', 'UBLL48-15-3', 'UBLL49-15-3', 'UBLL45-30-3']
  };

  const MODULE_GAP_PX = 8;
  const gapAngle = r => (MODULE_GAP_PX / (2 * Math.PI * r)) * 360;
  const buildArcs = (ids, r) => {
    const arcs = [];
    let angle = 0;
    ids.forEach(id => {
      const creditEntry = moduleInfo[id]?.keyInfo?.find(k => k.label === 'Credits');
      const credits = creditEntry ? parseFloat(creditEntry.value) : 0;
      const span = (credits / 120) * 360;
      const g = gapAngle(r) / 2;
      arcs.push({ id, start: angle + g, end: angle + span - g });
      angle += span;
    });
    return arcs;
  };

  const arcsByYear = {
    1: buildArcs(yearModules[1], yearRadii[0]),
    2: buildArcs(yearModules[2], yearRadii[1]),
    3: buildArcs(yearModules[3], yearRadii[2])
  };

  const [selected, setSelected] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);
  const baseStroke = '#FFFFFF';
  const hoverColor = '#FACC15';
  const selectedColor = '#F59E0B';
  const muted = '#E5E7EB';

  const strokeFor = id => {
    if (selected) {
      if (id === selected) return selectedColor;
      if (hovered === id) return hoverColor;
      return muted;
    }
    if (hovered === id) return hoverColor;
    return baseStroke;
  };

  const labelFillFor = id => {
    if (selected) {
      if (id === selected) return '#111827';
      if (hovered === id) return '#FFFFFF';
      return '#9CA3AF';
    }
    if (hovered === id) return '#FFFFFF';
    return '#111827';
  };

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {[1, 2, 3].map((year, idx) => (
        <g key={year}>
          {arcsByYear[year].map(arc => (
            <React.Fragment key={arc.id}>
              <path
                d={arcPath(cx, cy, yearRadii[idx], arc.start, arc.end)}
                stroke={strokeFor(arc.id)}
                strokeWidth={ringThickness}
                strokeLinecap="butt"
                fill="none"
                onMouseEnter={() => setHovered(arc.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(arc.id)}
                style={{ cursor: 'pointer', transition: 'stroke 280ms ease' }}
              />
              <ArcLabel
                id={`${arc.id}-label`}
                cx={cx}
                cy={cy}
                r={yearRadii[idx] - 4}
                fill={labelFillFor(arc.id)}
                start={arc.start + 2}
                end={arc.end - 2}
                text={moduleInfo[arc.id]?.moduleName}
                fontWeight="700"
              />
            </React.Fragment>
          ))}
        </g>
      ))}
    </svg>
  );
}

