import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import CompassChart from "./components/CompassChart.jsx";
import moduleInfo from "./data/moduleInfo.json";
import programmeInfo from "./data/programmeInfo.json";

// --- Donut sizing constants: keep position & diameter stable ---
const CHART_HEIGHT = 600;         // px – overall chart area height
const OUTER_R = 240;              // px – constant outer radius for the donut
const RING_THICKNESS = 28;        // px – thickness for concurrent bands
const RING_GUTTER = 6;            // px – visual gap between rings
const MODULE_INNER_R = 140;       // outer ring inner radius when a module is selected
const SECTION_INNER_R = 95;       // inner ring (sections) inner radius
const SECTION_OUTER_R = 130;      // inner ring (sections) outer radius
const ITEM_INNER_R = 60;          // innermost ring (items) inner radius
const ITEM_OUTER_R = 90;          // innermost ring (items) outer radius

// --- Simple radial label (robust) ---
const renderRadialLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, payload, percent }) => {
  if (!name || String(payload?.id || '').startsWith('spacer')) return null;
  // Hide labels for very small slices to avoid clutter
  if (typeof percent === 'number' && percent < 0.08) return null;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) / 2;
  const a = -midAngle * RAD; // Recharts midAngle is clockwise
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  const label = name.length > 32 ? name.slice(0, 29) + '…' : name;
  return (
    <text x={x} y={y} fill="#111827" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} style={{ pointerEvents: 'none' }}>
      {label}
    </text>
  );
};

// Custom label placed at slice mid‑angle (now uses robust radial label)
const renderSliceLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, ...rest }) => {
  return renderRadialLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, ...rest });
};

const DATA = {
  years: [
    {
      year: 1,
      modules: [
        { id: "UBLL48-15-3", code: "UBLL48-15-3", name: "Architectural Ethics & Agency", credits: 15, colour: "#fff",
          sections: [
            { id: "mlo", name: "Module Learning Outcomes", items: [
              { id: "m1", title: "Articulate ethical positions", description: "Evaluate frameworks and state a defensible stance." },
              { id: "m2", title: "Agency in practice", description: "Understand procurement, stakeholders and tactics." },
            ]},
            { id: "arb", name: "ARB Competencies", items: [
              { id: "a1", title: "CK3 – Social, ethical & inclusive", description: "Inclusive design within ethical frameworks." },
            ]},
          ]
        },
        { id: "UBLL49-15-3", code: "UBLL49-15-3", name: "Critical Architectural Practices", credits: 15, colour: "#22C55E",
          sections: [
            { id: "mlo", name: "Module Learning Outcomes", items: [
              { id: "m1", title: "Situate practice in discourse", description: "Historic, theoretical, geopolitical." },
            ]},
            { id: "arb", name: "ARB Competencies", items: [
              { id: "a1", title: "CK1 – Contextual knowledge", description: "Histories, theories, precedents." },
            ]},
          ]
        },
        { id: "UBLL46-30-3", code: "UBLL46-30-3", name: "Pathway Studio", credits: 30, colour: "#F59E0B",
          sections: [
            { id: "mlo", name: "Module Learning Outcomes", items: [
              { id: "m1", title: "Integrated proposal", description: "Site, tech, ethics." },
            ]},
          ]
        },
        { id: "UBLL47-30-3", code: "UBLL47-30-3", name: "Exploratory Design Studio", credits: 30, colour: "#8B5CF6",
          sections: [
            { id: "mlo", name: "Module Learning Outcomes", items: [
              { id: "m1", title: "Exploratory design", description: "Iterative experimentation and precedent analysis." },
            ]},
          ]
        },
        { id: "UBLL45-30-3", code: "UBLL45-30-3", name: "Zero Carbon Design & Innovation", credits: 30, colour: "#06B6D4",
          sections: [
            { id: "mlo", name: "Module Learning Outcomes", items: [
              { id: "m1", title: "Assembly knowledge", description: "Detailing and materials in low-carbon design." },
            ]},
          ]
        },
      ]
    }
  ]
};

const FALLBACK = ["#4F46E5","#EF4444","#06B6D4","#22C55E","#F59E0B","#8B5CF6","#14B8A6","#E11D48"];

export default function App() {
  const modules = useMemo(() => {
    const out = [];
    DATA.years.forEach(y => y.modules.forEach((m,i) =>
      out.push({ ...m, colour: m.colour || FALLBACK[i % FALLBACK.length], year: y.year })
    ));
    return out;
  }, []);
  const moduleNameById = useMemo(() => Object.fromEntries(modules.map(m => [m.id, m.name])), [modules]);
  const Y2_NAMES = {
    'UBLL4A-60-M': 'Design Thesis',
    'UBLL4B-15-M': 'Future Architectural Practice',
    'UBLL4C-15-M': 'Critical Manifesto',
    'UBLL4F-30-M': 'Ecological & Regenerative Approaches'
  };
  const displayNameById = useMemo(() => ({ ...Y2_NAMES, ...moduleNameById }), [moduleNameById]);

  // Fixed semester layout: two halves of the donut
  // S1: first half of the year -> two concurrent 15c modules (split the first 90°) then Pathway Studio for the second 90°.
  // S2: Exploratory Design Studio and Zero Carbon concurrent across the second half (split evenly).
  const SCHEDULE_ORDER = [
    "UBLL48-15-3", // AEA - first 45° of S1
    "UBLL49-15-3", // CAP - next 45° of S1
    "UBLL46-30-3", // Pathway Studio - remaining 90° of S1
    "UBLL47-30-3", // Exploratory Studio - first 90° of S2
    "UBLL45-30-3", // Zero Carbon - last 90° of S2
  ];
  const ANGLES = {
    "UBLL48-15-3": 45,
    "UBLL49-15-3": 45,
    "UBLL46-30-3": 90,
    "UBLL47-30-3": 90,
    "UBLL45-30-3": 90,
  };
  const semesterData = [
    { id: "S1", name: "Semester 1", value: 120, colour: "#E5E7EB" },
    { id: "S2", name: "Semester 2", value: 120, colour: "#E5E7EB" },
  ];

  // Programme view datasets: represent concurrency with two stacked rings (top/bottom)
  // StartAngle=90 means order is clockwise from top.
  // Top ring: AEA (90°), spacer (90°), Exploratory Studio (180°)
  const programmeTopData = [
    { id: "UBLL48-15-3", name: "UBLL48-15-3 · Architectural Ethics & Agency", value: 90, colour: "#4F46E5" },
    { id: "spacer-top-s1b", name: "", value: 90, colour: "transparent" },
    { id: "UBLL47-30-3", name: "UBLL47-30-3 · Exploratory Design Studio", value: 180, colour: "#8B5CF6" },
  ];
  // Bottom ring: CAP (90°), spacer (90°), Zero Carbon (180°)
  const programmeBottomData = [
    { id: "UBLL49-15-3", name: "UBLL49-15-3 · Critical Architectural Practices", value: 90, colour: "#22C55E" },
    { id: "spacer-bot-s1b", name: "", value: 90, colour: "transparent" },
    { id: "UBLL45-30-3", name: "UBLL45-30-3 · Zero Carbon Design & Innovation", value: 180, colour: "#06B6D4" },
  ];
  // Full-thickness solo (Pathway Studio) occupies S1 second quarter (90°–180°)
  const programmeFullData = [
    { id: "spacer-full-s1a", name: "", value: 90, colour: "transparent" },
    { id: "UBLL46-30-3", name: "UBLL46-30-3 · Pathway Studio", value: 90, colour: "#F59E0B" },
    { id: "spacer-full-s2", name: "", value: 180, colour: "transparent" },
  ];

  const [mod, setMod] = useState(null);
  const [sec, setSec] = useState(null);
  const [item, setItem] = useState(null);
  const [infoModuleId, setInfoModuleId] = useState(null);
  const [infoKey, setInfoKey] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);

  const programmeData = SCHEDULE_ORDER.map((id) => {
    const m = modules.find(x => x.id === id);
    return { id: m.id, name: `${m.code} · ${m.name}`, value: ANGLES[id], colour: m.colour, year: m.year };
  });

  const sectionData = useMemo(() => {
    if (!mod) return [];
    return mod.sections.map((s,i) => ({
      id: s.id, name: s.name, value: Math.max(1, s.items.length), colour: FALLBACK[i % FALLBACK.length]
    }));
  }, [mod]);

  const itemData = useMemo(() => {
    if (!sec) return [];
    return sec.items.map(it => ({ id: it.id, name: it.title, value: 1 }));
  }, [sec]);

  const resetTo = (level) => {
    if (level === "programme") { setMod(null); setSec(null); setItem(null); }
    if (level === "module") { setSec(null); setItem(null); }
    if (level === "section") { setItem(null); }
  };

  return (
    <div className="app-shell">
      <div className="page-grid">
        <div className="page-header">
          <h1 className="page-title">MArch Architecture @ UWE Bristol</h1>
          <button
            className="btn"
            onClick={() => { setMod(null); setSec(null); setItem(null); setInfoModuleId(null); setInfoKey(null); setResetSignal(v => v + 1); }}
          >
            Reset Chart
          </button>
        </div>
        {/* Donut (2/3) – on the right */}
        <div className="panel chart-panel">
          <div className="panel-header">
            <div className="breadcrumbs">
              {mod && (
                <button className="link" onClick={() => resetTo("module")}>{mod.name}</button>
              )}
              {sec && (
                <>
                  <span className="divider">/</span>
                  <button className="link" onClick={() => resetTo("section")}>{sec.name}</button>
                </>
              )}
              {item && (
                <>
                  <span className="divider">/</span>
                  <span className="current">{item.title}</span>
                </>
              )}
            </div>
          </div>
          <div className="chart-wrapper">
            <div className="chart-inner">
              <CompassChart
                resetSignal={resetSignal}
                onInfoSelect={(id, key) => { setInfoModuleId(id); setInfoKey(key); }}
              />
              {false && mod && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  {mod && (
                    <>
                       <Pie data={[{ name: mod.name, value: 1 }]} dataKey="value" nameKey="name"
                            innerRadius={MODULE_INNER_R}
                            outerRadius={OUTER_R}
                            cornerRadius={6}
                           isAnimationActive={false}>
                         <Cell fill={mod.colour || FALLBACK[0]} />
                       </Pie>
                       <Pie data={sectionData} dataKey="value" nameKey="name"
                            innerRadius={SECTION_INNER_R}
                            outerRadius={SECTION_OUTER_R}
                            paddingAngle={6}
                            cornerRadius={6}
                            label={renderSliceLabel}
                            labelLine={false}
                            stroke="#fff"
                            strokeWidth={3}
                            isAnimationActive={false}
                            onClick={(d) => {
                              const s = mod.sections.find(s => s.id === d.payload.id);
                              setSec(s); setItem(null);
                            }}>
                        {sectionData.map((e,i) => (
                          <Cell
                            key={i}
                            fill={e.colour || FALLBACK[i % FALLBACK.length]}
                            stroke="#fff"
                            opacity={hoverId && hoverId !== e.id ? 0.45 : 1}
                            cursor="pointer"
                            onMouseEnter={() => setHoverId(String(e.id))}
                            onMouseLeave={() => setHoverId(null)}
                          />
                        ))}
                      </Pie>
                    </>
                  )}
                   {sec && (
                    <Pie data={itemData} dataKey="value" nameKey="name"
                         innerRadius={ITEM_INNER_R}
                         outerRadius={ITEM_OUTER_R}
                         paddingAngle={6}
                         cornerRadius={6}
                         stroke="#fff"
                         strokeWidth={3}
                         isAnimationActive={false}
                         onClick={(d) => {
                           const it = sec.items.find(x => x.id === d.payload.id);
                           setItem(it);
                         }}>
                      {itemData.map((e,i) => (
                        <Cell
                          key={i}
                          fill={FALLBACK[i % FALLBACK.length]}
                          stroke="#fff"
                          opacity={hoverId ? 0.85 : 1}
                          cursor="pointer"
                          onMouseEnter={() => setHoverId(String(e.id))}
                          onMouseLeave={() => setHoverId(null)}
                        />
                      ))}
                    </Pie>
                  )}
                  <Tooltip formatter={(v, n, { payload }) => {
                    if (mod && !sec) return ["Click to open", payload.name];
                    if (sec && !item) return ["Click to view items", payload.name];
                    return [payload?.name || n, ""];
                  }}/>
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
        {/* Details (1/3) – on the left */}
        <div className="panel details-panel">
          <AnimatePresence mode="wait">
            {!mod && !infoKey && (
              <motion.div key="programme" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                <p className="item-desc">MArch at UWE is designed to empower you to become innovative designers, ethical future practitioners and catalysts for positive change in the built environment.</p>
                <p className="item-desc">The programme emphasises the importance of collaboration beyond traditional disciplines, encouraging work with local communities and industry professionals to address societal challenges and transform cities, places, and spaces for the benefit of both people and the planet.</p>
                <p className="item-desc">Through tailored pathways and research opportunities, we want to prepare you to lead in your chosen specialism and make meaningful contributions to the architectural profession.</p>
                <p className="item-desc"><strong>First Year (Pathway Year):</strong> The year focuses on grounding you in the broader context of architecture and empowering you to start shaping an emerging specialism. The modules encourage critical thinking, interdisciplinary collaboration, design competence and develop foundational professional and technical skills to address pressing global issues.</p>
                <p className="item-desc"><strong>Second Year (Specialism Year):</strong> The final year focuses on consolidating specialism and deepening expertise through independent research and practical application. Helping to prepare you to operate as an ethical practitioner ready to enter the profession and affect authentic change.</p>
              </motion.div>
            )}
            {mod && !sec && (
              <motion.div key="module" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                <h2 className="panel-title">{mod.name}</h2>
                <p className="muted">Choose a section to drill in:</p>
                <ul className="module-list">
                  {mod.sections.map(s => (
                    <li key={s.id} className="module-row">
                      <span>{s.name}</span>
                      <button className="link" onClick={() => setSec(s)}>Open</button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {sec && !item && (
              <motion.div key="section" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                <h2 className="panel-title">{sec.name}</h2>
                <ul className="item-list">
                  {sec.items.map(it => (
                    <li key={it.id} className="item-row">
                      <div className="item-head">
                        <span className="item-title">{it.title}</span>
                        <button className="link" onClick={() => setItem(it)}>Details</button>
                      </div>
                      <p className="item-desc">{it.description}</p>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
            {item && (
              <motion.div key="item" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                <h2 className="panel-title">{item.title}</h2>
                <p className="item-desc">{item.description}</p>
              </motion.div>
            )}
            {infoKey && infoModuleId && (
              <div>
                {(() => {
                  const isProgramme = infoModuleId === 'PROGRAMME';
                  const sectionLabel = (() => {
                    if (infoKey === 'threads') return 'Studio Threads';
                    if (infoKey === 'outcomes') return isProgramme ? 'Outcomes' : 'Module Outcomes';
                    return ({ keyInfo:'Key Info', synopsis:'Synopsis', arb:'ARB Competencies' }[infoKey] || infoKey);
                  })();
                  const titleLeft = isProgramme ? 'Programme' : (displayNameById[infoModuleId] || infoModuleId);
                  return (
                    <h2 className="panel-title">
                      {titleLeft} — {sectionLabel}
                      {!isProgramme && <span className="muted"> ({infoModuleId})</span>}
                    </h2>
                  );
                })()}
                {(() => {
                  const src = infoModuleId === 'PROGRAMME' ? programmeInfo : moduleInfo[infoModuleId] || {};
                  const val = src?.[infoKey];

                  // Special formatting for Programme Threads: bold title, keywords line, then paragraph-split description
                  if (infoModuleId === 'PROGRAMME' && infoKey === 'threads') {
                    const renderThread = (t, i) => {
                      if (!t) return null;
                      if (typeof t === 'string') {
                        // If thread is a plain string, split into paragraphs
                        const parts = t.trim().split(/\n\s*\n/).filter(Boolean);
                        return (
                          <div key={i}>
                            {parts.map((p, idx) => (
                              <p key={idx} className="item-desc">{p}</p>
                            ))}
                          </div>
                        );
                      }
                      // Object shape with title, keywords, description (may contain paragraphs)
                      const title = t.title || '';
                      const keywords = t.keywords || t.keyword || '';
                      const desc = t.description || '';
                      const paras = String(desc).trim().split(/\n\s*\n/).filter(Boolean);
                      return (
                        <div key={i}>
                          {title && <p className="item-desc"><strong>{title}</strong></p>}
                          {keywords && <p className="item-desc">({keywords})</p>}
                          {paras.length > 0 ? (
                            paras.map((p, idx) => <p key={idx} className="item-desc">{p}</p>)
                          ) : null}
                        </div>
                      );
                    };
                    const intro = programmeInfo?.threadsIntro ? (<p className="item-desc">{programmeInfo.threadsIntro}</p>) : null;
                    if (Array.isArray(val)) {
                      return <div>{intro}{val.map(renderThread)}</div>;
                    }
                    return <div>{intro}{renderThread(val, 0) || <p className="item-desc">No content yet.</p>}</div>;
                  }

                  // Special formatting for Module Threads: new JSON uses { label, value }
                  if (infoKey === 'threads' && infoModuleId !== 'PROGRAMME') {
                    const renderModuleThread = (t, i) => {
                      if (!t) return null;
                      if (typeof t === 'string') return <p key={i} className="item-desc">{t}</p>;
                      // Prefer label/value; fall back to title/description/keywords
                      const label = t.label || t.title || '';
                      const desc = t.value || t.description || '';
                      const keywords = t.keywords || t.keyword || '';
                      return (
                        <div key={i}>
                          {label && <p className="item-desc"><strong>{label}</strong></p>}
                          {keywords && <p className="item-desc">({keywords})</p>}
                          {String(desc).split(/\n\s*\n/).filter(Boolean).map((p, idx) => (
                            <p key={idx} className="item-desc">{p}</p>
                          ))}
                        </div>
                      );
                    };
                    if (Array.isArray(val)) return <div>{val.map(renderModuleThread)}</div>;
                    return renderModuleThread(val, 0) || <p className="item-desc">No content yet.</p>;
                  }

                  // Special formatting for Programme Learning Outcomes (PLOs): show code and bold keyword.
                  if (infoModuleId === 'PROGRAMME' && infoKey === 'outcomes') {
                    const intro = programmeInfo?.outcomesIntro ? (<p className="item-desc">{programmeInfo.outcomesIntro}</p>) : null;
                    if (Array.isArray(val)) {
                      return (
                        <div>
                          {intro}
                          {val.map((t, i) => {
                            if (t && typeof t === 'object') {
                              const code = t.code || t.id || '';
                              const keyword = t.keyword || t.keywords || t.title || '';
                              const desc = t.description || '';
                              return (
                                <p key={i} className="item-desc">
                                  {code && <span className="muted">{code} </span>}
                                  {keyword && <strong>{keyword}</strong>}
                                  {(keyword && desc) ? ': ' : ''}
                                  {desc || (!keyword ? (t.text || '') : '')}
                                </p>
                              );
                            }
                            // Fallback if string
                            return <p key={i} className="item-desc">{String(t)}</p>;
                          })}
                        </div>
                      );
                    }
                    if (val && typeof val === 'object') {
                      const code = val.code || val.id || '';
                      const keyword = val.keyword || val.keywords || val.title || '';
                      const desc = val.description || '';
                      return (
                        <div>
                          {intro}
                          <p className="item-desc">
                            {code && <span className="muted">{code} </span>}
                            {keyword && <strong>{keyword}</strong>}
                            {(keyword && desc) ? ': ' : ''}
                            {desc}
                          </p>
                        </div>
                      );
                    }
                    // Fallback
                    return (
                      <div>
                        {intro}
                        <p className="item-desc">{val || 'No content yet.'}</p>
                      </div>
                    );
                  }

                  // Special formatting for Module Key Info: split into separate lines
                  if (infoKey === 'keyInfo') {
                    // derive from module or programme (programme may not have keyInfo)
                    if (Array.isArray(val)) {
                      return (
                        <div>
                          {val.map((t, i) => {
                            if (t && typeof t === 'object') {
                              const label = t.label || t.key || '';
                              const value = t.value ?? t.text ?? '';
                              return (
                                <p key={i} className="item-desc">
                                  {label ? <><strong>{label}:</strong> </> : null}
                                  {String(value)}
                                </p>
                              );
                            }
                            return <p key={i} className="item-desc">{String(t)}</p>;
                          })}
                        </div>
                      );
                    }
                    if (val && typeof val === 'object') {
                      // Render known fields on their own lines
                      const fields = ['Credits', 'Semester', 'Assessment'];
                      const lines = [];
                      fields.forEach((k) => {
                        const key = k.toLowerCase();
                        if (val[key]) lines.push(`${k}: ${val[key]}`);
                      });
                      // Include other fields
                      Object.entries(val).forEach(([k,v]) => {
                        if (!['credits','semester','assessment'].includes(k)) lines.push(`${k}: ${v}`);
                      });
                      return (
                        <div>
                          {lines.length ? lines.map((ln, i) => <p key={i} className="item-desc">{ln}</p>) : <p className="item-desc">No content yet.</p>}
                        </div>
                      );
                    }
                    if (typeof val === 'string') {
                      // Split on middle dot bullets or commas/newlines
                      const parts = val
                        .split(/\s*[·\n\r,]+\s*/)
                        .map(s => s.trim())
                        .filter(Boolean);
                      return (
                        <div>
                          {parts.length ? parts.map((p,i) => <p key={i} className="item-desc">{p}</p>) : <p className="item-desc">No content yet.</p>}
                        </div>
                      );
                    }
                  }

                  // Generic rendering for other keys
                  if (Array.isArray(val)) {
                    return (
                      <div>
                        {val.map((t, i) => {
                          if (typeof t === 'string') {
                            // Bold leading codes like MO1, CK3, GC1, RE5, D2, PE1
                            const m = t.match(/^\s*((?:MO\d+|CK\d+|GC\d+|RE\d+|D\d+|PE\d+))[:\s-]*\s*(.*)$/);
                            if (m) {
                              return (
                                <p key={i} className="item-desc">
                                  <strong>{m[1]}</strong>{m[2] ? ' ' + m[2] : ''}
                                </p>
                              );
                            }
                            return <p key={i} className="item-desc">{t}</p>;
                          }
                          if (t && typeof t === 'object') {
                            const title = t.title ? `${t.title}: ` : '';
                            const desc = t.description || '';
                            const kw = t.keywords ? ` (Keywords: ${t.keywords})` : '';
                            const text = `${title}${desc}${kw}`.trim();
                            // Also bold leading codes if present in title
                            const m = text.match(/^\s*((?:MO\d+|CK\d+|GC\d+|RE\d+|D\d+|PE\d+))[:\s-]*\s*(.*)$/);
                            if (m) {
                              return (
                                <p key={i} className="item-desc">
                                  <strong>{m[1]}</strong>{m[2] ? ' ' + m[2] : ''}
                                </p>
                              );
                            }
                            return <p key={i} className="item-desc">{text}</p>;
                          }
                          return null;
                        })}
                      </div>
                    );
                  }
                  if (val && typeof val === 'object') {
                    const title = val.title ? `${val.title}: ` : '';
                    const desc = val.description || '';
                    const kw = val.keywords ? ` (Keywords: ${val.keywords})` : '';
                    const text = `${title}${desc}${kw}`.trim();
                    return <p className="item-desc">{text || 'No content yet.'}</p>;
                  }
                  if (typeof val === 'string') {
                    const parts = val.trim().split(/\n\s*\n/).filter(Boolean);
                    const fmt = (text, idx) => {
                      if (infoModuleId === 'PROGRAMME' && infoKey === 'synopsis') {
                        const m = text.match(/^(First Year .*?:)\s*(.*)$/i) || text.match(/^(Second Year .*?:)\s*(.*)$/i);
                        if (m) {
                          return (
                            <p key={idx} className="item-desc">
                              <strong>{m[1]}</strong> {m[2]}
                            </p>
                          );
                        }
                      }
                      // Bold leading codes for module outcomes/arb lines
                      const m2 = text.match(/^\s*((?:MO\d+|CK\d+|GC\d+|RE\d+|D\d+|PE\d+))[:\s-]*\s*(.*)$/);
                      if (m2) {
                        return (
                          <p key={idx} className="item-desc">
                            <strong>{m2[1]}</strong>{m2[2] ? ' ' + m2[2] : ''}
                          </p>
                        );
                      }
                      return <p key={idx} className="item-desc">{text}</p>;
                    };
                    if (parts.length > 0) {
                      return <div>{parts.map(fmt)}</div>;
                    }
                    return <p className="item-desc">{val}</p>;
                  }
                  return <p className="item-desc">{val || 'No content yet.'}</p>;
                })()}
              </div>
            )}
            
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
