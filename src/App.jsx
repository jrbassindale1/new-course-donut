import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CompassChart from "./components/CompassChart.jsx";
import moduleInfo from "./data/moduleInfo.json";
import programmeInfo from "./data/programmeInfo.json";
// App is now focused on the CompassChart + info panel only

export default function App() {

  // State for the info panel (driven by CompassChart)
  const [infoModuleId, setInfoModuleId] = useState(null);
  const [infoKey, setInfoKey] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);


  return (
    <div className="app-shell">
      <div className="page-grid">
        <div className="page-header">
          <h1 className="page-title">BSc Architecture @ UWE Bristol</h1>
          <button
            className="btn"
            onClick={() => { setInfoModuleId(null); setInfoKey(null); setResetSignal(v => v + 1); }}
          >
            Reset Chart
          </button>
        </div>
        {/* Donut (2/3) – on the right */}
        <div className="panel chart-panel">
          <div className="panel-header">
            <div className="breadcrumbs" />
          </div>
          <div className="chart-wrapper">
            <div className="chart-inner">
              <CompassChart
                resetSignal={resetSignal}
                onInfoSelect={(id, key) => { setInfoModuleId(id); setInfoKey(key); }}
              />
            </div>
          </div>
        </div>
        {/* Details (1/3) – on the left */}
        <div className="panel details-panel">
          <AnimatePresence mode="wait">
            {!infoKey && (
              <motion.div key="programme" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
                {(() => {
                  const syn = (programmeInfo && programmeInfo.synopsis) ? String(programmeInfo.synopsis).trim() : '';
                  // Split synopsis into paragraphs on blank lines for readability
                  const paras = syn.split(/\n\s*\n/).filter(Boolean);
                  return (
                    <div>
                      {paras.length ? paras.map((p,i) => (<p key={i} className="item-desc">{p}</p>)) : null}
                      <p className="item-desc"><strong>Click on the programme diagram to find out more about the course.</strong></p>
                    </div>
                  );
                })()}
              </motion.div>
            )}
            {infoKey && infoModuleId && (
              <div>
                {(() => {
                  const isProgramme = infoModuleId === 'PROGRAMME';
                  const sectionLabel = (() => {
                    if (infoKey === 'threads') return 'Studio Threads';
                    if (infoKey === 'outcomes') return isProgramme ? 'Outcomes' : 'Module Outcomes';
                    return ({
                      keyInfo:'Key Info',
                      synopsis:'Synopsis',
                      learningAndTeaching:'Learning & Teaching',
                      supportAndFacilities:'Support & Facilities',
                      professionalRecognition:'Professional Recognition',
                    }[infoKey] || infoKey);
                  })();
                  const titleLeft = isProgramme ? 'Programme' : ((moduleInfo[infoModuleId] && moduleInfo[infoModuleId].moduleName) || infoModuleId);
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
                      // Bold leading codes for module outcomes lines
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
